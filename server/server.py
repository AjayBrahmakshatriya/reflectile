from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn

import threading
import os
import json

import reflectile


GAME_PORT=6677

class RequestHandler(BaseHTTPRequestHandler):
	def end_headers (self):
		self.send_header('Access-Control-Allow-Origin', '*')
		BaseHTTPRequestHandler.end_headers(self)
	def bad_request(self):
		self.send_response(402)
		self.end_headers()

	def response(self, body):
		self.send_response(200)
		self.end_headers()
		self.wfile.write(bytes(json.dumps(body), 'utf-8'))
		return

	def do_GET(self):
		return self.bad_request()

	def do_POST(self):
		url = self.path
		if url != "/api":
			return self.bad_request()
		length = int(self.headers['Content-Length'])
		body = self.rfile.read(length)

		print(body)
		body_json = json.loads(body.decode())
	

		command = body_json["command"]

		if command == "hello":
			return self.response({"response": "hello", "test": "hello from server"})
		elif command == "create":
			return self.response(reflectile.do_create(body_json))
		elif command == "join":
			return self.response(reflectile.do_join(body_json))
		elif command == "waitjoin":
			return self.response(reflectile.do_waitjoin(body_json))
		elif command == "waitturn":
			return self.response(reflectile.do_waitturn(body_json))
		elif command == "playturn":
			return self.response(reflectile.do_playturn(body_json))

class ThreadingGameServer(ThreadingMixIn, HTTPServer):
	pass


def main():
	server = ThreadingGameServer(('0.0.0.0', GAME_PORT), RequestHandler)

	try:
		server.serve_forever()
	except:
		print("Killing server and all games")

	server.server_close()

if __name__ == "__main__":
	main()
