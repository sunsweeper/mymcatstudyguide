// The V24 Next Card dialog exposes the same production rating buttons.
module.exports = async page => {
  if(await page.locator('#studyRatingModal').isVisible()) return;
  const pending = await page.evaluate(() => !!pendingR);
  await page.click(pending ? '#changeStudyRating' : '#studyNext');
};
