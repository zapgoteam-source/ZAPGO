/**
 * 고객 API 라우트
 * 
 * 고객 정보의 CRUD 작업을 처리하며, 개인정보(이름, 전화번호, 주소)는
 * 서버 사이드에서 자동으로 암호화/복호화됩니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { encrypt, decrypt } from '@/lib/encryption';

// Supabase 클라이언트 생성 (서버 사이드용, 사용자 토큰 사용)
function getSupabaseClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
  }
  
  // Authorization 헤더에서 토큰 추출
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  // 토큰이 있으면 global 옵션으로 클라이언트 생성
  const client = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
  
  return client;
}

/**
 * GET - 고객 목록 조회
 * 복호화된 고객 정보를 반환합니다.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient(request);
    
    // URL에서 쿼리 파라미터 가져오기
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get('tenant_id');
    
    // 고객 데이터 조회
    let query = supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    
    // tenant_id 필터링 (제공된 경우)
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('고객 조회 오류:', error);
      return NextResponse.json(
        { error: '고객 정보를 조회할 수 없습니다.' },
        { status: 500 }
      );
    }
    
    // 개인정보 복호화
    const decryptedData = data?.map((customer: any) => ({
      ...customer,
      name: decrypt(customer.name) || '',
      phone: decrypt(customer.phone) || '',
      address: decrypt(customer.address),
    }));
    
    return NextResponse.json({ data: decryptedData });
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST - 고객 추가
 * 개인정보를 암호화하여 저장합니다.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient(request);
    const body = await request.json();
    
    // 개인정보 암호화
    const encryptedData = {
      name: encrypt(body.name),
      phone: encrypt(body.phone),
      address: encrypt(body.address),
      status: body.status,
      issues: body.issues || [],
      notes: body.notes,
      desired_quote_date: body.desired_quote_date || null,
      tenant_id: body.tenant_id,
      created_by: body.created_by,
    };
    
    const { data, error } = await supabase
      .from('customers')
      .insert(encryptedData)
      .select()
      .single();
    
    if (error) {
      console.error('고객 추가 오류:', error);
      return NextResponse.json(
        { error: '고객을 추가할 수 없습니다.', detail: error.message, code: error.code },
        { status: 500 }
      );
    }
    
    // 저장된 데이터 복호화하여 반환
    const decryptedData = {
      ...data,
      name: decrypt(data.name),
      phone: decrypt(data.phone),
      address: decrypt(data.address),
    };
    
    return NextResponse.json({ data: decryptedData });
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PUT - 고객 정보 수정
 * 개인정보를 암호화하여 업데이트합니다.
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseClient(request);
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: '고객 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 개인정보 암호화
    const encryptedData = {
      name: encrypt(body.name),
      phone: encrypt(body.phone),
      address: encrypt(body.address),
      status: body.status,
      issues: body.issues || [],
      notes: body.notes,
      desired_quote_date: body.desired_quote_date || null,
      updated_at: new Date().toISOString(),
      updated_by: body.updated_by,
    };
    
    const { data, error } = await supabase
      .from('customers')
      .update(encryptedData)
      .eq('id', body.id)
      .select()
      .single();
    
    if (error) {
      console.error('고객 수정 오류:', error);
      return NextResponse.json(
        { error: '고객 정보를 수정할 수 없습니다.' },
        { status: 500 }
      );
    }
    
    // 수정된 데이터 복호화하여 반환
    const decryptedData = {
      ...data,
      name: decrypt(data.name),
      phone: decrypt(data.phone),
      address: decrypt(data.address),
    };
    
    return NextResponse.json({ data: decryptedData });
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - 고객 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseClient(request);
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: '고객 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('고객 삭제 오류:', error);
      return NextResponse.json(
        { error: '고객을 삭제할 수 없습니다.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

