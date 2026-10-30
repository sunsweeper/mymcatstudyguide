// Existing behavioral suites now use the real Next Card -> rating dialog sequence.
exports.rate=async(page,selector,written)=>{
  await page.waitForFunction(()=>!flipping);
  const ui=await page.evaluate(()=>!!window.MCATStudyUI);
  if(ui){const pending=await page.evaluate(()=>!!pendingR);await page.click(pending?'#studyChangeRating':'#studyNext');}
  await page.click(selector);
  // Struggled / Didn't know: the adaptive learning box is in the pop-up; write in it and Save and Next Card.
  if(ui&&await page.isVisible('#popupReinforce').catch(()=>false)){await page.fill('#popupReinforce',written||'A reinforcement answer written in my own words.');await page.click('#gradeAccept');}
};
