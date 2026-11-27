const designPath = '/ocr-gui-design';

// Both entries use the same editor-facing HTML and strategy catalog. Only the
// same-origin asset and controller URLs differ in the standalone entry.
export function designDocuments(shell, catalog) {
  const withDesignAssets = source => source.replaceAll('"/ocr-console/', '"' + designPath + '/');
  const designCatalog = withDesignAssets(catalog).replace('route: "/ocr-test"', 'route: "' + designPath + '/test"');
  return [
    ['', ['text/html', withDesignAssets(shell)]],
    ['catalog.js', ['text/javascript', designCatalog]]
  ];
}
