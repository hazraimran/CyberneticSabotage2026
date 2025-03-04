import os
import http.server
import socketserver

PORT = int(os.environ.get("PORT", 8080))  # Render dynamically assigns a port

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Redirect root ("/") to "/public/index.html"
        if self.path == "/":
            self.send_response(302)  # HTTP 302 Redirect
            self.send_header("Location", "/public/")  # Redirect target
            self.end_headers()
        else:
            super().do_GET()
    def end_headers(self):
        # Add custom headers (CORS and caching)
        self.send_header("Access-Control-Allow-Origin", "*")  # Allow all origins
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        super().end_headers()

# Change directory to serve frontend files
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
os.chdir(DIRECTORY)

# Start server
with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
    print(f"Serving at port {PORT}")
    httpd.serve_forever()




