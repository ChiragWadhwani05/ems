import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Create response
    const response = NextResponse.json({
      message: 'Logout successful',
      success: true,
    });

    // Clear the access token cookie
    response.cookies.set('access-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/', // Make sure to clear from root path
    });

    return response;
  } catch (err) {
    console.error('Logout error:', err);

    // Even if there's an error, we should still clear the cookie
    const response = NextResponse.json({
      message: 'Logout completed',
      success: true,
    });

    response.cookies.set('access-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return response;
  }
}

// Optional: Support GET method for logout links
export async function GET() {
  try {
    const response = NextResponse.json({
      message: 'Logout successful',
      success: true,
    });

    // Clear the access token cookie
    response.cookies.set('access-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Logout error:', err);

    const response = NextResponse.json({
      message: 'Logout completed',
      success: true,
    });

    response.cookies.set('access-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return response;
  }
}
