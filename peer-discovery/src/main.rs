//! Example code for using MongoDB with Actix.

mod model;
#[cfg(test)]
mod test;

use actix_web::{get, post, web, App, HttpResponse, HttpServer};

use mongodb::{bson::doc, options::ClientOptions, Client};
use peer_discovery::RecordService;
use serde::{Deserialize, Serialize};

const DB_NAME: &str = "peer_discovery";
const COLL_NAME: &str = "records";
const PEER_TIMEOUT_SECONDS: u64 = 90;

use std::time::Duration;

#[derive(Serialize)]
struct CommonResponse<T> {
    code: i32,
    msg: String,
    data: T,
}

#[get("/")]
async fn index() -> HttpResponse {
    HttpResponse::Ok().json(CommonResponse {
        code: 0,
        msg: "".to_string(),
        data: "",
    })
}

#[derive(Deserialize)]
struct HeartbeatRequest {
    #[serde(rename = "peerID")]
    pub peer_id: String,
    pub ipv4: String,
    pub ipv6: String,
}

#[derive(Serialize)]
struct HeartbeatResponse {
    #[serde(rename = "peerIDs")]
    pub peer_ids: Vec<String>,
}

#[post("/api/heartbeat")]
async fn heartbeat(
    record_service: web::Data<RecordService>,
    req_body: web::Json<HeartbeatRequest>,
) -> HttpResponse {
    if let Err(err) = record_service
        .upsert(&req_body.peer_id, &req_body.ipv4, &req_body.ipv6, None)
        .await
    {
        return HttpResponse::InternalServerError().json(CommonResponse {
            code: 1,
            msg: "MongoDB insert record failed".to_string(),
            data: err.to_string(),
        });
    }

    if let Err(err) = record_service.remove_expired(PEER_TIMEOUT_SECONDS).await {
        return HttpResponse::InternalServerError().json(CommonResponse {
            code: 1,
            msg: "MongoDB delete timeout record failed".to_string(),
            data: err.to_string(),
        });
    }

    match record_service
        .get_peers_by_ip(&req_body.ipv4, &req_body.ipv6)
        .await
    {
        Ok(peer_ids) => HttpResponse::Ok().json(CommonResponse {
            code: 0,
            msg: "".to_string(),
            data: HeartbeatResponse { peer_ids },
        }),
        Err(err) => HttpResponse::InternalServerError().json(CommonResponse {
            code: 1,
            msg: "MongoDB get peers by ip failed".to_string(),
            data: err.to_string(),
        }),
    }
}

async fn get_mongo_client(uri: &str) -> Client {
    let mut client_options = ClientOptions::parse(uri)
        .await
        .expect("failed to parse options");
    client_options.connect_timeout = Some(Duration::from_secs(1));
    client_options.server_selection_timeout = Some(Duration::from_secs(1));

    Client::with_options(client_options).expect("failed to connect")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let uri = std::env::var("MONGODB_URI")
        .unwrap_or_else(|_| "mongodb://root:E8kHTYJca96gEC@mongo:27017".into());

    // let client = Client::with_uri_str(uri).await.expect("failed to connect");
    // create_username_index(&client).await;

    let client = get_mongo_client(&uri).await;

    let record_service = RecordService::new(client.clone(), DB_NAME, COLL_NAME);
    record_service
        .create_peerid_index()
        .await
        .expect("failed to create index");

    let port = 8080;
    println!("Starting server on port {}", port);
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(record_service.clone()))
            .service(heartbeat)
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
