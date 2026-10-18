// Historical observation probes; regression assertions live in tests/stabilization.test.js.
// Always starts a disposable MongoDB; never reads MONGO_URL or a production .env.
const {createRequire}=require('node:module');
const req=createRequire(require('node:path').join(__dirname, '../package.json'));
const express=req('express'), request=req('supertest'), mongoose=req('mongoose');
const {MongoMemoryServer}=req('mongodb-memory-server');
const users=req('./models/userModel'), transactions=req('./models/transactionModel');
const {categoryModel:categories}=req('./models/categoryModel');
(async()=>{
 const mongo=await MongoMemoryServer.create();
 try {
  await mongoose.connect(mongo.getUri());
  process.env.JWT_SECRET='phase-zero-synthetic-probe-only';
  const app=express();app.use(express.json());
  for(const key of ['user','transaction','category','dashboard'])app.use('/'+key,req('./routes/'+key+'Route'));
  const make=async name=>(await request(app).post('/user/register').send({name,email:name.toLowerCase()+'@example.com',password:'Synthetic-probe-password!'})).body;
  const a=await make('AuditA'),b=await make('AuditB');
  const auth=(r,u=a)=>r.set('Authorization','Bearer '+u.token);
  const date=new Date().toISOString();
  await categories.create([{name:'Audit shared',type:'expense',userId:a.user.id,color:'#111111',icon:'OWN'},{name:'Audit shared',type:'expense',userId:b.user.id,color:'#222222',icon:'OTHER-USER'}]);
  const created=await auth(request(app).post('/transaction')).send({type:'expense',amount:12.34,category:'Audit shared',date});
  const id=created.body.transaction._id;
  const summary=await auth(request(app).get('/transaction/stats/summary'));
  const dashboard=await auth(request(app).get('/dashboard/overview'));
  console.log(JSON.stringify({case:'aggregation-objectid',transactionSummary:summary.body.stats.overall.totalExpenses,dashboardExpense:dashboard.body.overview.currentMonth.totalExpenses,expected:12.34}));
  const report=await auth(request(app).get('/dashboard/category-report?type=expense'));
  console.log(JSON.stringify({case:'category-lookup-isolation',rowCount:report.body.categories.length,total:report.body.totalAmount,includesOtherUsersIcon:report.body.categories.some(x=>x.icon==='OTHER-USER'),expectedRows:1,expectedTotal:12.34}));
  console.log(JSON.stringify({case:'cross-user-transaction-CRUD',read:(await auth(request(app).get('/transaction/'+id),b)).status,update:(await auth(request(app).put('/transaction/'+id),b).send({amount:99})).status,delete:(await auth(request(app).delete('/transaction/'+id),b)).status,expected:404}));
  const uncapped=await auth(request(app).get('/transaction?limit=0'));
  const invalid=await auth(request(app).get('/transaction/not-an-object-id'));
  console.log(JSON.stringify({case:'query-boundaries',zeroLimitStatus:uncapped.status,invalidObjectIdStatus:invalid.status,expected:400}));
  await users.updateOne({_id:a.user.id},{$set:{isActive:false}});
  console.log(JSON.stringify({case:'disabled-session',existingSessionStatus:(await auth(request(app).get('/transaction'))).status,expected:403}));
 }finally{await mongoose.disconnect();await mongo.stop();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
