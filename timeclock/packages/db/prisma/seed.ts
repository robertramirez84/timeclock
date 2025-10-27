import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function readJSON<T = any>(file: string): T {
  const p = path.join(process.cwd(), 'packages/db/prisma/data', file);
  return JSON.parse(fs.readFileSync(p, 'utf8')) as T;
}

function semiMonthlyPeriodFor(date: Date){
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  if(d <= 15){
    return { start: new Date(y,m,1,0,0,0,0), end: new Date(y,m,15,23,59,59,999), payDate: new Date(y,m,20,0,0,0,0) };
  } else {
    const last = new Date(y,m+1,0).getDate();
    return { start: new Date(y,m,16,0,0,0,0), end: new Date(y,m,last,23,59,59,999), payDate: new Date(y,m+1,5,0,0,0,0) };
  }
}

async function main(){
  console.log('🌱 Seeding Four Points Dual Brand...');

  const departments = readJSON<any[]>('departments.json');
  const jobcodes = readJSON<any[]>('jobcodes.json');
  for(const d of departments){
    await prisma.department.upsert({ where:{ code: d.code }, update:{ name: d.name }, create:{ code: d.code, name: d.name }});
  }
  for(const j of jobcodes){
    const dept = await prisma.department.findUnique({ where:{ code: j.departmentCode } });
    if(!dept) throw new Error(`Missing department ${j.departmentCode} for job ${j.code}`);
    await prisma.jobCode.upsert({
      where:{ code: j.code },
      update:{ title: j.title, basePayRate: j.basePayRate, departmentId: dept.id },
      create:{ code: j.code, title: j.title, basePayRate: j.basePayRate, departmentId: dept.id }
    });
  }

  const employees = readJSON<any[]>('employees.json');
  for(const e of employees){
    const dept = await prisma.department.findUnique({ where:{ code: e.departmentCode } });
    if(!dept) throw new Error(`Missing department ${e.departmentCode} for ${e.email}`);
    await prisma.employeeProfile.upsert({
      where:{ email: e.email },
      update:{ firstName: e.firstName, lastName: e.lastName, pin4: e.pin4, role: e.role, departmentId: dept.id, birthDate: new Date(e.birthDate) },
      create:{ email: e.email, firstName: e.firstName, lastName: e.lastName, pin4: e.pin4, role: e.role, departmentId: dept.id, birthDate: new Date(e.birthDate) }
    });
  }

  const kiosks = readJSON<any[]>('kiosks.json');
  for(const k of kiosks){
    await prisma.kioskDevice.upsert({ where:{ id: k.id }, update:{ name: k.name, deviceKey: k.deviceKey, isActive: true }, create:{ id: k.id, name: k.name, deviceKey: k.deviceKey, isActive: true }});
  }

  const settings = readJSON<Record<string,string>>('settings.json');
  for(const [key,value] of Object.entries(settings)){
    await prisma.orgSetting.upsert({ where:{ key }, update:{ value }, create:{ key, value } });
  }

  const now = new Date();
  const pp = semiMonthlyPeriodFor(now);
  const budgets = readJSON<any[]>('department-budgets.json');
  for(const b of budgets){
    const dept = await prisma.department.findUnique({ where:{ code: b.departmentCode } });
    if(!dept) throw new Error(`Missing department ${b.departmentCode} for budget`);
    await prisma.departmentBudget.upsert({
      where:{ departmentId_periodStart_periodEnd: { departmentId: dept!.id, periodStart: pp.start, periodEnd: pp.end } },
      update:{ budgetHours: b.budgetHours, budgetPay: b.budgetPay },
      create:{ departmentId: dept!.id, periodStart: pp.start, periodEnd: pp.end, budgetHours: b.budgetHours, budgetPay: b.budgetPay }
    });
  }

  await prisma.payPeriod.upsert({
    where:{ startDate_endDate: { startDate: pp.start, endDate: pp.end } },
    update:{},
    create:{ startDate: pp.start, endDate: pp.end, status: 'open' }
  });

  console.log('✅ Seed complete');
}

main().catch(e=>{ console.error(e); process.exit(1); }).finally(()=> prisma.$disconnect());
