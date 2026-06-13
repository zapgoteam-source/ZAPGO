# ZAPGO 초기화 후 복구 안내

## 클라우드 원본

- 소스코드: `https://github.com/zapgoteam-source/ZAPGO`
- 운영 배포: `https://zapgo-eight.vercel.app`
- Vercel 프로젝트: `zapgoteam-1081s-projects/zapgo`
- Supabase 프로젝트: `ajdsmodlpaxhydvnckyb`
- Google Sheets ID: Vercel의 `GOOGLE_SHEETS_ID` 환경변수에서 확인

## 새 Mac에서 복구

```bash
git clone https://github.com/zapgoteam-source/ZAPGO.git
cd ZAPGO
npm install
npx vercel link
npx vercel env pull .env.local --environment=production
npm run build
```

Vercel에서 내려받을 수 없는 로컬 설정이 있다면 Google Drive의
`ZAPGO_RECOVERY_PRIVATE` 폴더에 저장된 암호화 백업을 복호화해 사용한다.

```bash
openssl enc -d -aes-256-cbc -pbkdf2 \
  -in zapgo-private-config.tar.gz.enc \
  -out zapgo-private-config.tar.gz
tar -xzf zapgo-private-config.tar.gz
```

복호화 암호는 프로젝트 폴더와 다른 안전한 장소(비밀번호 관리자 등)에
보관해야 한다.

## 다시 연결해야 하는 도구

1. GitHub CLI 또는 Git 인증
2. Vercel CLI 로그인 및 프로젝트 연결
3. Supabase CLI 로그인 및 프로젝트 연결
4. Google Drive 데스크톱 동기화
5. 필요한 경우 Google 서비스 계정 키 재발급

## 보안 주의

- `.env.local`, 서비스 계정 JSON, 개인키는 Git에 커밋하지 않는다.
- 채팅이나 로컬 명령 기록에 노출된 키는 초기화와 별개로 회전한다.
- 운영 환경변수의 기준 저장소는 Vercel로 유지한다.
