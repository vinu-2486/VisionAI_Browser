function extractDomSummary(documentSnapshot) {
  return {
    title: documentSnapshot?.title || 'Untitled page',
    formCount: documentSnapshot?.forms?.length || 0,
    fields: documentSnapshot?.fields || [],
  };
}

module.exports = { extractDomSummary };
