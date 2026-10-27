// Existing behavioral suites now use the real Next Card -> rating dialog sequence.
exports.rate=async(page,selector)=>{
  await page.waitForFunction(()=>!flipping);
  const ui=await page.evaluate(()=>!!window.MCATStudyUI);
  if(ui){const pending=await page.evaluate(()=>!!pendingR);await page.click(pending?'#studyChangeRating':'#studyNext');}
  await page.click(selector);
};
