/* Limited JSON Schema subset shared by preview and tests. */
(function (root) {
  'use strict';
  function parseSchema(schema) {
    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) throw Error('Schema harus berupa object.');
    const permitted = ['type', 'title', 'properties', 'required'];
    if (Object.keys(schema).some(k => !permitted.includes(k)) || schema.type !== 'object') throw Error('Hanya schema object sederhana yang didukung.');
    if ('title' in schema && (typeof schema.title !== 'string' || schema.title.length > 100)) throw Error('Judul maksimal 100 karakter.');
    const props = schema.properties;
    if (!props || typeof props !== 'object' || Array.isArray(props) || Object.keys(props).length < 1 || Object.keys(props).length > 20) throw Error('Properties harus berisi 1–20 field.');
    const required = schema.required || [];
    if (!Array.isArray(required) || new Set(required).size !== required.length || required.some(k => typeof k !== 'string' || !Object.hasOwn(props, k))) throw Error('Daftar required tidak valid.');
    for (const [name, spec] of Object.entries(props)) {
      if (!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(name) || !spec || typeof spec !== 'object' || Array.isArray(spec)) throw Error('Nama atau definisi field tidak valid.');
      if (Object.keys(spec).some(k => !['type', 'title', 'enum'].includes(k)) || !['string', 'number'].includes(spec.type)) throw Error('Tipe atau properti field belum didukung.');
      if ('title' in spec && (typeof spec.title !== 'string' || !spec.title.trim() || spec.title.length > 100)) throw Error('Judul field tidak valid.');
      if ('enum' in spec && (spec.type !== 'string' || !Array.isArray(spec.enum) || spec.enum.length < 1 || spec.enum.length > 30 || spec.enum.some(v => typeof v !== 'string' || !v || v.length > 100) || new Set(spec.enum).size !== spec.enum.length)) throw Error('Enum harus berisi 1–30 pilihan teks unik dan tidak kosong.');
    }
    return schema;
  }
  function validate(schema, values) {
    parseSchema(schema);
    if (!values || typeof values !== 'object' || Array.isArray(values)) return ['Hasil harus object.'];
    const errors = [];
    for (const key of Object.keys(values)) if (!Object.hasOwn(schema.properties, key)) errors.push(`Field tidak dikenal: ${key}`);
    for (const [key, spec] of Object.entries(schema.properties)) {
      const value = values[key];
      if (value === undefined || value === '') { if ((schema.required || []).includes(key)) errors.push(`${key} wajib diisi.`); continue; }
      if (spec.type === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) errors.push(`${key} harus angka.`);
      if (spec.type === 'string' && (typeof value !== 'string' || value.length > 1000)) errors.push(`${key} harus teks maksimal 1000 karakter.`);
      else if (spec.enum && !spec.enum.includes(value)) errors.push(`${key} bukan pilihan yang tersedia.`);
    }
    return errors;
  }
  const api = { parseSchema, validate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FormSchema = api;
})(typeof window !== 'undefined' ? window : globalThis);
