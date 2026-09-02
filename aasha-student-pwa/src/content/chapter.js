export const CHAPTER={
 id:'fractions-demo',title:'Fractions — Understanding Parts of a Whole',grade:6,subject:'Mathematics',language_defaults:['en','hi'],schema_version:1,
 nodes:[
  {id:'fraction_parts',title:'Fraction Parts',objective:'Identify numerator and denominator and explain what each represents.',dependencies:[],steps:[
   {type:'explain',text:'A fraction describes equal parts of a whole. The numerator tells how many parts we have; the denominator tells how many equal parts make the whole.'},
   {type:'visual',visual:'fraction',data:{total:5,active:3}},
   {type:'check',prompt:'Which number tells how many equal parts make the whole?'}
  ],words:{fraction:'अंश',numerator:'अंश संख्या',denominator:'हर',whole:'पूर्ण वस्तु'}},
  {id:'equivalent',title:'Equivalent Fractions',objective:'Recognize fractions that represent the same quantity.',dependencies:['fraction_parts'],steps:[
   {type:'explain',text:'Equivalent fractions look different but represent the same quantity, such as 1/2 and 2/4.'},
   {type:'visual',visual:'bar',data:{label:'Same quantity, different names',percent:50}},
   {type:'check',prompt:'Which fraction is equivalent to 1/2?'}
  ],words:{equivalent:'समतुल्य',quantity:'मात्रा',represent:'दर्शाना'}},
  {id:'addition',title:'Adding Fractions with the Same Denominator',objective:'Add numerators while keeping the common denominator.',dependencies:['equivalent'],steps:[
   {type:'explain',text:'When denominators are the same, add the numerators and keep the denominator unchanged. Example: 1/5 + 2/5 = 3/5.'},
   {type:'visual',visual:'fraction',data:{total:5,active:3}},
   {type:'check',prompt:'What is 1/5 + 2/5?'}
  ],words:{denominator:'हर',numerator:'अंश',unchanged:'अपरिवर्तित'}}
 ]
};
export const QUESTIONS=[
 {id:'M1',node_id:'fraction_parts',prompt:'In 3/5, what is the numerator?',options:['3','5','8','2'],correct_index:0,explanation:'The numerator is the top number.',misconception:'Confusing the numerator with the denominator.'},
 {id:'M2',node_id:'fraction_parts',prompt:'In 2/7, what does 7 tell us?',options:['Parts selected','Equal parts in the whole','Total students','The numerator'],correct_index:1,explanation:'The denominator tells how many equal parts make the whole.',misconception:'Confusing the denominator with the number of selected parts.'},
 {id:'M3',node_id:'equivalent',prompt:'Which fraction is equivalent to 1/2?',options:['2/4','1/3','3/5','2/5'],correct_index:0,explanation:'2/4 represents the same quantity as 1/2.',misconception:'Comparing numerals instead of comparing value.'},
 {id:'M4',node_id:'addition',prompt:'1/5 + 2/5 = ?',options:['3/10','2/5','3/5','1/5'],correct_index:2,explanation:'Add the numerators: 1 + 2 = 3 and keep denominator 5.',misconception:'Adding denominators when they are already equal.'}
];
