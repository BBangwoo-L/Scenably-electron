"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
exports.getDatabasePath = getDatabasePath;
const child_process_1 = require("child_process");
async function initializeDatabase() {
    try {
        console.log('데이터베이스 초기화 시작...');
        // Prisma 클라이언트 생성
        console.log('Prisma 클라이언트 생성 중...');
        (0, child_process_1.execSync)('npx prisma generate', {
            stdio: 'inherit',
            cwd: process.cwd(),
        });
        // 데이터베이스 마이그레이션 실행
        console.log('데이터베이스 마이그레이션 실행 중...');
        (0, child_process_1.execSync)('npx prisma migrate deploy', {
            stdio: 'inherit',
            cwd: process.cwd(),
        });
        console.log('데이터베이스 초기화 완료!');
    }
    catch (error) {
        console.error('데이터베이스 초기화 실패:', error);
        // 마이그레이션이 없다면 개발용으로 푸시
        try {
            console.log('개발용 데이터베이스 푸시 시도...');
            (0, child_process_1.execSync)('npx prisma db push', {
                stdio: 'inherit',
                cwd: process.cwd(),
            });
            console.log('개발용 데이터베이스 설정 완료!');
        }
        catch (pushError) {
            console.error('데이터베이스 설정 실패:', pushError);
            throw pushError;
        }
    }
}
function getDatabasePath() {
    return process.env.DATABASE_URL;
}
