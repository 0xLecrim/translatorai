import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory user storage for demonstration
// In production, this would be replaced with a proper database with hashed passwords
let users: Array<{
  id: string;
  username: string;
  email: string;
  password: string; // In production, this should be hashed
  createdAt: string;
}> = [];

// Simple session storage
let sessions: Array<{
  sessionId: string;
  userId: string;
  expiresAt: string;
}> = [];

export async function POST(request: NextRequest) {
  try {
    const { action, username, email, password } = await request.json();

    if (action === 'register') {
      // Check if user already exists
      const existingUser = users.find(u => u.email === email || u.username === username);
      if (existingUser) {
        return NextResponse.json(
          { error: 'Użytkownik o podanym emailu lub nazwie już istnieje' },
          { status: 400 }
        );
      }

      // Create new user
      const newUser = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        username,
        email,
        password, // In production, hash this password
        createdAt: new Date().toISOString()
      };

      users.push(newUser);

      // Create session
      const sessionId = Math.random().toString(36).substr(2, 15);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

      sessions.push({
        sessionId,
        userId: newUser.id,
        expiresAt
      });

      return NextResponse.json({
        success: true,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email
        },
        sessionId
      });

    } else if (action === 'login') {
      // Find user
      const user = users.find(u => 
        (u.email === email || u.username === email) && u.password === password
      );

      if (!user) {
        return NextResponse.json(
          { error: 'Nieprawidłowe dane logowania' },
          { status: 401 }
        );
      }

      // Create session
      const sessionId = Math.random().toString(36).substr(2, 15);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

      sessions.push({
        sessionId,
        userId: user.id,
        expiresAt
      });

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        sessionId
      });

    } else if (action === 'logout') {
      const { sessionId } = await request.json();
      
      // Remove session
      sessions = sessions.filter(s => s.sessionId !== sessionId);

      return NextResponse.json({ success: true });

    } else if (action === 'verify') {
      const { sessionId } = await request.json();
      
      // Find valid session
      const session = sessions.find(s => 
        s.sessionId === sessionId && new Date(s.expiresAt) > new Date()
      );

      if (!session) {
        return NextResponse.json(
          { error: 'Sesja wygasła' },
          { status: 401 }
        );
      }

      // Find user
      const user = users.find(u => u.id === session.userId);
      if (!user) {
        return NextResponse.json(
          { error: 'Użytkownik nie znaleziony' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });
    }

    return NextResponse.json(
      { error: 'Nieprawidłowa akcja' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    );
  }
}
