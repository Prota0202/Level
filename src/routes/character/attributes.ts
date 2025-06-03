// src/routes/api/character/attributes.ts
import { json } from "@solidjs/router";
import { APIEvent } from "@solidjs/start/server";
import jwt from "jsonwebtoken";
import db from "~/lib/db";

async function getUserFromToken(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, process.env.AUTH_SECRET!) as { userId: number };
  
  return await db.user.findUnique({
    where: { id: decoded.userId },
    include: { character: true }
  });
}

export async function PUT({ request }: APIEvent) {
  try {
    const user = await getUserFromToken(request);
    if (!user || !user.character) {
      return json({ error: "Character not found" }, { status: 404 });
    }

    const { strength, intelligence, endurance, availablePoints } = await request.json();

    const updatedCharacter = await db.character.update({
      where: { id: user.character.id },
      data: {
        strength,
        intelligence,
        endurance,
        availablePoints,
      },
    });

    return json({
      strength: updatedCharacter.strength,
      intelligence: updatedCharacter.intelligence,
      endurance: updatedCharacter.endurance,
      availablePoints: updatedCharacter.availablePoints,
    });
  } catch (error) {
    console.error('Update attributes error:', error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}