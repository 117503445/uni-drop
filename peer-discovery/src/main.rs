//! Example code for using MongoDB with Actix.

mod model;
#[cfg(test)]
mod test;

use actix_web::{get, post, web, App, HttpResponse, HttpServer};
use model::{Record, User};
use mongodb::{
    bson::{de, doc},
    options::{FindOneAndUpdateOptions, IndexOptions, ClientOptions},
    Client, Collection, IndexModel,
};
use serde::{Deserialize, Serialize};
const DB_NAME: &str = "peer_discovery";
const COLL_NAME: &str = "records";
const PEER_TIMEOUT_MINUTES: i64 = 5;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

fn get_timestamp(start: SystemTime) -> i64 {
    let since_the_epoch = start
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards");
    since_the_epoch.as_millis() as i64
}

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
    client: web::Data<Client>,
    req_body: web::Json<HeartbeatRequest>,
) -> HttpResponse {
    let collection = client.database(DB_NAME).collection::<Record>(COLL_NAME);

    let options = FindOneAndUpdateOptions::builder()
        .upsert(Some(true))
        .build();

    if let Err(reason) = collection
        .find_one_and_update(
            doc! { "peer_id": &req_body.peer_id },
            doc! { "$set": {
                "ipv4": &req_body.ipv4,
                "ipv6": &req_body.ipv6,
                "last_seen": get_timestamp(SystemTime::now()),
            }},
            options,
        )
        .await
    {
        return HttpResponse::InternalServerError().json(CommonResponse {
            code: 1,
            msg: "MongoDB insert failed".to_string(),
            data: reason.to_string(),
        });
    }

    HttpResponse::Ok().json(CommonResponse {
        code: 0,
        msg: "".to_string(),
        data: "",
    })
}

/// Adds a new user to the "users" collection in the database.
#[post("/add_user")]
async fn add_user(client: web::Data<Client>, form: web::Form<User>) -> HttpResponse {
    let collection = client.database(DB_NAME).collection(COLL_NAME);
    let result = collection.insert_one(form.into_inner(), None).await;
    match result {
        Ok(_) => HttpResponse::Ok().body("user added"),
        Err(err) => HttpResponse::InternalServerError().body(err.to_string()),
    }
}

/// Gets the user with the supplied username.
#[get("/get_user/{username}")]
async fn get_user(client: web::Data<Client>, username: web::Path<String>) -> HttpResponse {
    let username = username.into_inner();
    let collection: Collection<User> = client.database(DB_NAME).collection(COLL_NAME);
    match collection
        .find_one(doc! { "username": &username }, None)
        .await
    {
        Ok(Some(user)) => HttpResponse::Ok().json(user),
        Ok(None) => {
            HttpResponse::NotFound().body(format!("No user found with username {username}"))
        }
        Err(err) => HttpResponse::InternalServerError().body(err.to_string()),
    }
}

/// Creates an index on the "username" field to force the values to be unique.
async fn create_username_index(client: &Client) {
    let options = IndexOptions::builder().unique(true).build();
    let model = IndexModel::builder()
        .keys(doc! { "username": 1 })
        .options(options)
        .build();
    client
        .database(DB_NAME)
        .collection::<User>(COLL_NAME)
        .create_index(model, None)
        .await
        .expect("creating an index should succeed");
}

async fn create_peerid_index(client: &Client) {
    let options = IndexOptions::builder().unique(true).build();
    let model = IndexModel::builder()
        .keys(doc! { "peer_id": 1 })
        .options(options)
        .build();
    client
        .database(DB_NAME)
        .collection::<Record>(COLL_NAME)
        .create_index(model, None)
        .await
        .expect("creating an index should succeed");
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let uri = std::env::var("MONGODB_URI")
        .unwrap_or_else(|_| "mongodb://root:E8kHTYJca96gEC@mongo:27017".into());

    // let client = Client::with_uri_str(uri).await.expect("failed to connect");
    // create_username_index(&client).await;

    let mut client_options = ClientOptions::parse(uri).await.expect("failed to parse options");
    client_options.connect_timeout = Some(Duration::from_secs(1));
    client_options.server_selection_timeout = Some(Duration::from_secs(1));

    let client = Client::with_options(client_options).expect("failed to connect");
    create_peerid_index(&client).await;

    let port = 8080;
    println!("Starting server on port {}", port);
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(client.clone()))
            .service(add_user)
            .service(get_user)
            .service(heartbeat)
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
