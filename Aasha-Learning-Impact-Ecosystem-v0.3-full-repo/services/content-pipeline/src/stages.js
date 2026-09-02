import { validateChapter } from '../../../packages/content-schema/src/index.js';
export function pipelineStages(){return ['source_intake','structure_detection','chapter_segmentation','concept_extraction','tln_draft','question_drafts','asset_match','human_validation','production_package'];}
export function validateProductionPackage(chapter,{humanApproved=false}){const valid=validateChapter(chapter);if(!humanApproved)throw new Error('content requires human validation before production');return {...valid,publicationState:'production'};}
