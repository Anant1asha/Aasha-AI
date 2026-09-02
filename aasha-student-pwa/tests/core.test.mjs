import test from 'node:test';
import assert from 'node:assert/strict';
import {computeMastery,progressionDecision} from '../src/core/teas.js';
import {validateChapter,validateQuestion} from '../src/core/content-schema.js';
import {awardQuizReward} from '../src/core/rewards.js';
import {CHAPTER,QUESTIONS} from '../src/content/chapter.js';

test('chapter schema is valid for class 1-10 compatible model',()=>{assert.deepEqual(validateChapter(CHAPTER),{valid:true,errors:[]})});
test('question schema binds questions to TLN nodes',()=>{const ids=new Set(CHAPTER.nodes.map(n=>n.id)); for(const q of QUESTIONS) assert.equal(validateQuestion(q,ids).valid,true)});
test('mastery is deterministic and not game score',()=>{const s={events:[
 {event_type:'answer_submitted',payload:{node_id:'n',result:'correct'}},
 {event_type:'answer_submitted',payload:{node_id:'n',result:'incorrect',misconception:'x'}},
 {event_type:'answer_submitted',payload:{node_id:'n',result:'correct'}},
 {event_type:'answer_submitted',payload:{node_id:'n',result:'correct'}}]};
 const m=computeMastery(s,'n'); assert.equal(m.accuracy,75); assert.equal(m.mastery,75); assert.equal(progressionDecision({mastery:{n:m}},'n').action,'advance');
});
test('reward ledger is idempotent',()=>{const s={coins:0,xp:0,streak:0,reward_ledger:[],events:[],sync_outbox:[],badges:[]}; const r1=awardQuizReward(s,{event_id:'E1',result:'correct'}); const r2=awardQuizReward(s,{event_id:'E1',result:'correct'}); assert.equal(r1.coins_delta,2); assert.equal(r2.duplicate,true); assert.equal(s.coins,2)});
