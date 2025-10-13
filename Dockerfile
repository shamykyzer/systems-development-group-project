name: Docker Image CI
on:
  push: { branches: [ "main" ] }
  pull_request: { branches: [ "main" ] }

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Show workspace (debug)
        run: ls -la

      - name: Build image
        run: docker build . --file Dockerfile --tag bakery-ui:test

      - name: Run container
        run: docker run -d --name bakery-ui -p 8080:80 bakery-ui:test

      - name: Smoke check
        run: |
          for i in {1..20}; do
            if curl -fsS http://localhost:8080 >/dev/null; then
              echo "OK"; exit 0
            fi
            sleep 1
          done
          echo "No response"; docker logs bakery-ui || true; exit 1

      - name: Cleanup
        if: always()
        run: docker rm -f bakery-ui || true
