import asyncio
import httpx
import sys

async def verify():
    # Wait for the server to be ready
    base_url = "http://localhost:8000"
    
    async with httpx.AsyncClient() as client:
        # Check health
        try:
            r = await client.get(f"{base_url}/health")
            if r.status_code != 200:
                print("Server is not healthy.")
                sys.exit(1)
        except httpx.ConnectError:
            print("Server is not running. Please start the server.")
            sys.exit(1)

        print("Testing POST /api/v1/sessions...")
        r_post = await client.post(f"{base_url}/api/v1/sessions", json={"task_description": "Build an API"})
        assert r_post.status_code == 201, f"Expected 201, got {r_post.status_code}"
        data = r_post.json()
        assert "id" in data, "No ID in response"
        assert "X-Request-ID" in r_post.headers, "X-Request-ID not in headers"
        print("✅ POST /api/v1/sessions works and returns 201 with X-Request-ID")

        print("Testing GET /api/v1/sessions/{invalid_id}...")
        r_invalid = await client.get(f"{base_url}/api/v1/sessions/invalid_123")
        assert r_invalid.status_code == 404, f"Expected 404, got {r_invalid.status_code}"
        data_invalid = r_invalid.json()
        assert "error" in data_invalid and data_invalid["error"] == "SessionNotFoundException", "Incorrect error JSON"
        assert "X-Request-ID" in r_invalid.headers, "X-Request-ID not in headers for 404"
        print("✅ GET /api/v1/sessions/{invalid_id} returns 404 with proper JSON")

        print("Testing /docs (Swagger UI)...")
        r_docs = await client.get(f"{base_url}/docs")
        assert r_docs.status_code == 200, f"Expected 200, got {r_docs.status_code}"
        assert b"Swagger UI" in r_docs.content or b"swagger-ui" in r_docs.content, "Swagger UI not found in /docs"
        print("✅ Swagger UI is available at /docs")

if __name__ == "__main__":
    asyncio.run(verify())
