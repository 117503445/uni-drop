use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder};
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
struct CommonResponse<T> {
    code: i32,
    msg: String,
    data: T,
}

#[get("/")]
async fn index() -> impl Responder {
    HttpResponse::Ok().json(CommonResponse {
        code: 0,
        msg: "".to_string(),
        data: "",
    })
}

#[derive(Deserialize)]
struct HeartbeatRequest {
    ip: String,
    peer_id: String,
}

#[post("/api/heartbeat")]
async fn heartbeat(req_body: web::Json<HeartbeatRequest>) -> impl Responder {
    
    HttpResponse::Ok().json(CommonResponse {
        code: 0,
        msg: "".to_string(),
        data: "",
    })
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let port = 8080;
    println!("Starting server on port {}", port);

    HttpServer::new(|| App::new().service(index))
        .bind(("0.0.0.0", port))?
        .run()
        .await
}
