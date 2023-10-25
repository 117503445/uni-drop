FROM rust:1.73.0 as build-env
WORKDIR /app
COPY . /app
RUN cargo build --release

FROM gcr.io/distroless/cc-debian12
COPY --from=build-env /app/target/release/peer-discovery /
CMD ["./peer-discovery"]