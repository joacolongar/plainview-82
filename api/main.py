"""Backend opcional de Plainview 8:2 (Etapa 5 del roadmap).

No hace falta para lanzar: el sitio funciona 100% estático.
Correr con:  uvicorn main:app --reload
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Plainview 8:2 API")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["*"], allow_headers=["*"])


@app.get("/health")
def health() -> dict:
    return {"ok": True}


# S15 — Duelo en vivo: por ahora una sala que reenvía mensajes a todos los conectados.
rooms: dict[str, set[WebSocket]] = {}


@app.websocket("/ws/duelo/{room}")
async def duel(ws: WebSocket, room: str) -> None:
    await ws.accept()
    players = rooms.setdefault(room, set())
    players.add(ws)
    try:
        while True:
            msg = await ws.receive_json()
            for p in list(players):
                await p.send_json(msg)
    except WebSocketDisconnect:
        players.discard(ws)
        if not players:
            rooms.pop(room, None)
