// Expose the stylesheet to other projects
function getStylesheet() {
  return HtmlService.createHtmlOutputFromFile('Stylesheet').getContent();
}
