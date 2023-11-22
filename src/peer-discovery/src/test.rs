use peer_discovery::{get_timestamp, PinService};
use std::time::SystemTime;

use super::*;

#[actix_web::test]
// #[ignore = "requires MongoDB instance running"]
async fn record_test() {
    let client = get_mongo_client("mongodb://root:E8kHTYJca96gEC@mongo:27017").await;
    let record_service = RecordService::new(client, "peer_discovery_test");

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

#[actix_web::test]
async fn pin_test() {
    let client = get_mongo_client("mongodb://root:E8kHTYJca96gEC@mongo:27017").await;
    let pin_service = PinService::new(client, "peer_discovery_test");

    pin_service
        .create_index()
        .await
        .expect("failed to create index");

    pin_service
        .upsert(
            "peer0",
            "1234",
            Some(get_timestamp(SystemTime::now() - Duration::from_secs(50))),
        )
        .await
        .expect("failed to insert record"); // expired

    pin_service.remove_expired(30).await.unwrap();

    assert!(pin_service
        .get_peerid_by_pin("1234")
        .await
        .expect("failed to get peerid by pin")
        .is_none());

    pin_service
        .upsert("peer0", "1234", None)
        .await
        .expect("failed to insert record");

    assert!(pin_service
        .get_peerid_by_pin("1234")
        .await
        .expect("failed to get peerid by pin")
        .is_some());

    pin_service
        .upsert("peer0", "1234", None)
        .await
        .expect("failed to insert record");
    assert!(pin_service
        .get_peerid_by_pin("1234")
        .await
        .expect("failed to get peerid by pin")
        .is_some());

    pin_service
        .upsert("peer0", "0123", None)
        .await
        .expect("failed to insert record");
    assert!(pin_service
        .get_peerid_by_pin("0123")
        .await
        .expect("failed to get peerid by pin")
        .is_some());

    pin_service
        .upsert("peer1", "0123", None)
        .await
        .expect_err("should not insert record");

    pin_service
        .upsert("peer1", "1234", None)
        .await
        .expect("failed to get peerid by pin");
    assert!(pin_service
        .get_peerid_by_pin("1234")
        .await
        .expect("failed to get peerid by pin")
        .is_some());

    pin_service.remove_all().await.unwrap();
}
