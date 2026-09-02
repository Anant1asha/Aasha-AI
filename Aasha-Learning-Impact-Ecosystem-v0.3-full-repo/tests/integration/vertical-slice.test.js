import test from 'node:test'; import assert from 'node:assert/strict';
import { OfflineOutbox, makeEvent } from '../../packages/offline-sync/src/index.js';
import { createProfile } from '../../packages/learner-profile/src/index.js';
class Mem{constructor(){this.m=new Map()}getItem(k){return this.m.get(k)??null}setItem(k,v){this.m.set(k,v)}}
test('offline event outbox survives and syncs',async()=>{const s=new Mem(),o=new OfflineOutbox(s),p=createProfile({learnerId:'l1',grade:6});o.enqueue(makeEvent({eventId:'e1',learnerId:p.learnerId,deviceId:'d1',type:'attempt',payload:{correct:true}}));o.enqueue(makeEvent({eventId:'e1',learnerId:p.learnerId,deviceId:'d1',type:'attempt',payload:{correct:true}}));let sent=[];const r=await o.sync(async e=>sent.push(e.eventId));assert.deepEqual(r,{sent:1,failed:0});assert.equal(o.list().length,0);assert.deepEqual(sent,['e1'])});
