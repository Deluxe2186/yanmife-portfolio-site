import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { error } = await supabaseServer
      .from('projects')
      .select('id')
      .limit(1);

    if (error) {
      return Response.json({ status: 'error', message: error.message }, { status: 500 });
    }

    return Response.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Database is alive',
    });
  } catch (err: any) {
    return Response.json({ status: 'error', message: err.message }, { status: 500 });
  }
}
