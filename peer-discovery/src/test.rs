use actix_web::{
    test::{call_and_read_body, call_and_read_body_json, init_service, TestRequest},
    web::Bytes,
};
use mongodb::Client;
use peer_discovery::get_timestamp;

use super::*;

#[actix_web::test]
// #[ignore = "requires MongoDB instance running"]
async fn test() {
    let client = get_mongo_client("mongodb://root:E8kHTYJca96gEC@mongo:27017").await;
    let record_service = RecordService::new(client, "peer_discovery_test", COLL_NAME);

    record_service
        .create_peerid_index()
        .await
        .expect("failed to create index");

    record_service
        .upsert(
            "peer0",
            "127.0.0.1",
            "fe80::1",
            Some(get_timestamp(SystemTime::now() - Duration::from_secs(50))),
        )
        .await
        .expect("failed to insert record"); // expired

    record_service
        .upsert("peer1", "127.0.0.1", "fe80::1", None)
        .await
        .expect("failed to insert record");
    record_service
        .upsert("peer2", "127.0.0.2", "fe80::1", None)
        .await
        .expect("failed to insert record");

    let peer_ids = record_service
        .get_peers_by_ip("127.0.0.1", "fe80::1")
        .await
        .unwrap();
    assert_eq!(peer_ids, vec!["peer0", "peer1", "peer2"]);

    record_service
        .remove_expired(30)
        .await
        .expect("failed to remove expired records");

    let peer_ids = record_service
        .get_peers_by_ip("127.0.0.1", "fe80::1")
        .await
        .unwrap();

    assert_eq!(peer_ids, vec!["peer1", "peer2"]);

    record_service
        .remove_all()
        .await
        .expect("failed to remove all records");
}
