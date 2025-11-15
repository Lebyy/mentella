import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred', {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === 'user.created') {
    await dbConnect();

    const { id, email_addresses, first_name, last_name, phone_numbers } = evt.data;

    try {
      await User.create({
        clerkId: id,
        email: email_addresses[0]?.email_address || '',
        name: `${first_name || ''} ${last_name || ''}`.trim() || 'User',
        phone: phone_numbers[0]?.phone_number || '',
      });

      console.log(`User created in MongoDB: ${id}`);
    } catch (error) {
      console.error('Error creating user in MongoDB:', error);
      return new Response('Error creating user', { status: 500 });
    }
  }

  if (eventType === 'user.updated') {
    await dbConnect();

    const { id, email_addresses, first_name, last_name, phone_numbers } = evt.data;

    try {
      await User.findOneAndUpdate(
        { clerkId: id },
        {
          email: email_addresses[0]?.email_address || '',
          name: `${first_name || ''} ${last_name || ''}`.trim() || 'User',
          phone: phone_numbers[0]?.phone_number || '',
        }
      );

      console.log(`User updated in MongoDB: ${id}`);
    } catch (error) {
      console.error('Error updating user in MongoDB:', error);
    }
  }

  if (eventType === 'user.deleted') {
    await dbConnect();

    const { id } = evt.data;

    try {
      await User.findOneAndDelete({ clerkId: id });
      console.log(`User deleted from MongoDB: ${id}`);
    } catch (error) {
      console.error('Error deleting user from MongoDB:', error);
    }
  }

  return new Response('', { status: 200 });
}
