function detectFormFields(domSnapshot) {
  const fields = domSnapshot?.fields || [];

  return fields.map((field) => ({
    key: field.key,
    label: field.label,
    required: Boolean(field.required),
    type: field.type || 'text',
  }));
}

module.exports = { detectFormFields };
