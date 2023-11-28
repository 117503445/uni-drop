```bash
base64 /dev/urandom | head -c 10000000 > test-10m.txt
base64 /dev/urandom | head -c 100000000 > test-100m.txt
base64 /dev/urandom | head -c 1000000000 > test-1g.txt
```
