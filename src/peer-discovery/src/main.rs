//! Example code for using MongoDB with Actix.

mod model;
#[cfg(test)]
mod test;

use actix_cors::Cors;
use actix_web::{get, post, web, App, HttpResponse, HttpServer};
use mongodb::{bson::doc, options::ClientOptions, Client};
use peer_discovery::{PinService, RecordService};
use serde::{Deserialize, Serialize};

const DB_NAME: &str = "peer_discovery";
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

#[post("/api/remove")]
async fn remove_all(record_service: web::Data<RecordService>) -> HttpResponse {
    if !cfg!(debug_assertions) {
        return HttpResponse::Ok().json(CommonResponse {
            code: 401,
            msg: "You have no permission to remove all records".to_string(),
            data: "",
        });
    }

    if let Err(err) = record_service.remove_all().await {
        return HttpResponse::InternalServerError().json(CommonResponse {
            code: 1,
            msg: "MongoDB remove all records failed".to_string(),
            data: err.to_string(),
        });
    }

    HttpResponse::Ok().json(CommonResponse {
        code: 0,
        msg: "".to_string(),
        data: "",
    })
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

    if cfg!(debug_assertions) {
        const REMAIN: u64 = 2;

        if let Err(err) = record_service.remove_remain(REMAIN).await {
            return HttpResponse::InternalServerError().json(CommonResponse {
                code: 1,
                msg: "MongoDB delete remain record failed".to_string(),
                data: err.to_string(),
            });
        }
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

#[derive(Deserialize)]
struct PinUpsertRequest {
    #[serde(rename = "peerID")]
    pub peer_id: String,
}

#[derive(Serialize)]
struct PinUpsertResponse {
    #[serde(rename = "pinCode")]
    pub pin: String,
}

#[post("/api/pin")]
async fn pin_upsert(
    pin_service: web::Data<PinService>,
    req_body: web::Json<PinUpsertRequest>,
) -> HttpResponse {
    if let Err(err) = pin_service.remove_expired(PEER_TIMEOUT_SECONDS).await {
        return HttpResponse::InternalServerError().json(CommonResponse {
            code: 1,
            msg: "MongoDB delete timeout pin failed".to_string(),
            data: err.to_string(),
        });
    }

    let pin_result = pin_service.get_pin_by_peerid(&req_body.peer_id).await;
    if let Err(err) = pin_result {
        return HttpResponse::InternalServerError().json(CommonResponse {
            code: 1,
            msg: "MongoDB get pin by peerid failed".to_string(),
            data: err.to_string(),
        });
    }

    // if pin_result is not none, pin = pin_result.unwrap()
    // else pin = pin_service.get_available_pin_code()
    let pin;
    if let Some(pin_code) = pin_result.unwrap() {
        pin = pin_code;
    } else {
        let pin_result = pin_service.get_available_pin_code().await;
        if let Err(err) = pin_result {
            return HttpResponse::InternalServerError().json(CommonResponse {
                code: 1,
                msg: "MongoDB get available pin code failed".to_string(),
                data: err.to_string(),
            });
        }
        pin = pin_result.unwrap();
    }

    if let Err(err) = pin_service
        .upsert(&req_body.peer_id, &pin, None)
        .await
    {
        return HttpResponse::InternalServerError().json(CommonResponse {
            code: 1,
            msg: "MongoDB insert pin failed".to_string(),
            data: err.to_string(),
        });
    }

    HttpResponse::Ok().json(CommonResponse {
        code: 0,
        msg: "".to_string(),
        data: PinUpsertResponse { pin },
    })
}

#[derive(Serialize)]
struct PinGetResponse {
    #[serde(rename = "peerID")]
    pub peer_id: String,
}

#[get("/api/pin/{pin}")]
async fn pin_get(
    pin_service: web::Data<PinService>,
    path: web::Path<String>,
) -> HttpResponse {

    let pin = path.into_inner();

    if let Err(err) = pin_service.remove_expired(PEER_TIMEOUT_SECONDS).await {
        return HttpResponse::InternalServerError().json(CommonResponse {
            code: 1,
            msg: "MongoDB delete timeout pin failed".to_string(),
            data: err.to_string(),
        });
    }

    match pin_service.get_peerid_by_pin(&pin).await {
        Ok(peer_id) => HttpResponse::Ok().json(CommonResponse {
            code: 0,
            msg: "".to_string(),
            data: PinGetResponse { peer_id },
        }),
        Err(err) => HttpResponse::InternalServerError().json(CommonResponse {
            code: 1,
            msg: "MongoDB get peerid by pin failed: ".to_string() + err.to_string().as_str(),
            data: ""
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

    let record_service = RecordService::new(client.clone(), DB_NAME);
    record_service
        .create_peerid_index()
        .await
        .expect("failed to create index");

    let pin_service = PinService::new(client, DB_NAME);
    pin_service
        .create_index()
        .await
        .expect("failed to create index");

    let port = 8080;
    println!("Starting server on port {}", port);
    HttpServer::new(move || {
        // TODO
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header();

        App::new()
            .wrap(cors)
            .app_data(web::Data::new(record_service.clone()))
            .app_data(web::Data::new(pin_service.clone()))
            .service(heartbeat)
            .service(remove_all)
            .service(index)
            .service(pin_upsert)
            .service(pin_get)
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
