'use strict';
const input = document.querySelector('#schema-input');
const original = input.value;
const form = document.querySelector('#preview-form');
const fields = document.querySelector('#fields');
const schemaStatus = document.querySelector('#schema-status');
const resultStatus = document.querySelector('#result-status');
const output = document.querySelector('#output');
let activeSchema = null;

function build() {
  try {
    const schema = FormSchema.parseSchema(JSON.parse(input.value));
    const fragment = document.createDocumentFragment();
    for (const [name, spec] of Object.entries(schema.properties)) {
      const label = document.createElement('label');
      const control = document.createElement(spec.enum ? 'select' : 'input');
      control.id = 'field-' + name; control.name = name; control.required = (schema.required || []).includes(name);
      label.htmlFor = control.id; label.textContent = (spec.title || name) + (control.required ? ' *' : '');
      if (spec.enum) {
        const empty = document.createElement('option'); empty.value = ''; empty.textContent = 'Pilih...'; control.append(empty);
        for (const value of spec.enum) { const option = document.createElement('option'); option.value = value; option.textContent = value; control.append(option); }
      } else { control.type = spec.type === 'number' ? 'number' : 'text'; if (spec.type === 'number') control.step = 'any'; else control.maxLength = 1000; }
      fragment.append(label, control);
    }
    fields.replaceChildren(fragment); activeSchema = schema;
    schemaStatus.textContent = 'Pratinjau siap.'; resultStatus.textContent = ''; output.textContent = 'Belum ada hasil.';
  } catch (error) { activeSchema = null; fields.replaceChildren(); output.textContent = 'Belum ada hasil.'; schemaStatus.textContent = 'Schema tidak valid: ' + error.message; resultStatus.textContent = ''; }
}
function collect() {
  if (!activeSchema) throw Error('Buat pratinjau terlebih dahulu.');
  const data = {};
  for (const [name, spec] of Object.entries(activeSchema.properties)) {
    const value = form.elements.namedItem(name).value;
    if (value !== '') data[name] = spec.type === 'number' ? Number(value) : value;
  }
  const errors = FormSchema.validate(activeSchema, data);
  if (errors.length) throw Error(errors.join(' '));
  if (!form.reportValidity()) throw Error('Periksa field yang ditandai.');
  return data;
}
document.querySelector('#build').addEventListener('click', build);
document.querySelector('#reset').addEventListener('click', () => { input.value = original; build(); });
form.addEventListener('submit', event => { event.preventDefault(); try { const data = collect(); output.textContent = JSON.stringify(data, null, 2); resultStatus.textContent = 'Isian valid.'; } catch (error) { output.textContent = 'Belum ada hasil.'; resultStatus.textContent = error.message; } });
document.querySelector('#export').addEventListener('click', () => { try { const data = collect(); const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'}); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'hasil-formulir.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); output.textContent = JSON.stringify(data, null, 2); resultStatus.textContent = 'Hasil siap diunduh.'; } catch (error) { output.textContent = 'Belum ada hasil.'; resultStatus.textContent = error.message; } });
build();
