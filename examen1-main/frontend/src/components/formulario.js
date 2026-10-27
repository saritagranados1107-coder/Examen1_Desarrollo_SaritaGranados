import { crearEquipo, listarCategorias } from "../modules/equipos.js";
import { mostrarMensaje } from "./mensajes.js";

/**
 * TODO [F3] Formulario de registro de equipos.
 *
 * iniciarFormulario({ alGuardar }):
 *  1. Llene el <select id="categoria_id"> con listarCategorias()
 *     (cree cada <option> con createElement, value = id, texto = nombre).
 *  2. Al enviar el formulario (submit):
 *     - Evite el envío tradicional.
 *     - Limpie los errores anteriores: textContent de [data-error] y aria-invalid de los campos.
 *     - Construya el objeto con FormData. categoria_id y costo_interno deben ir como números.
 *     - Deshabilite #btn-guardar y cambie su texto a "Guardando…" mientras espera.
 *     - Llame a crearEquipo(datos).
 *     - Éxito: limpie el formulario, mostrarMensaje("exito", "Equipo <codigo> registrado.")
 *              y llame a alGuardar().
 *     - 422: por cada campo de error.datos.errors, escriba el PRIMER mensaje en
 *            el <p data-error="<campo>"> y marque el campo con aria-invalid="true".
 *     - Otro error: mostrarMensaje("error", ...).
 *     - Siempre (finally): rehabilite el botón y restaure su texto.
 */
import { ErrorApi } from '../modules/api.js';
import { crearEquipo, listarCategorias } from '../modules/equipos.js';
import { cargarPagina } from './listado.js';

const formulario = document.querySelector('#form-equipo');
const select = formulario.querySelector('[name="categoria_id"]');
const boton = formulario.querySelector('button[type="submit"]');

// Inicia el formulario del registro de los equipos
async function cargarCategorias() {
  try {
    const { data } = await listarCategorias();
    select.append(...data.map(({ id, nombre }) => new Option(nombre, id)));
  } catch (error) {
    alert(error.message);
  }
}

// Método solo para quitar los errores previos del formulario y que no afecten al nuevo envío
function limpiarErrores() {
  formulario.querySelectorAll('[data-error]').forEach((p) => (p.textContent = ''));
  formulario.querySelectorAll('[aria-invalid]').forEach((c) => c.removeAttribute('aria-invalid'));
}

function mostrarErrores(errores) {
  for (const [campo, mensajes] of Object.entries(errores)) {
    const parrafo = formulario.querySelector(`[data-error="${campo}"]`);
    if (parrafo) parrafo.textContent = mensajes[0];
    formulario.querySelector(`[name="${campo}"]`)?.setAttribute('aria-invalid', 'true');
  }
}

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  limpiarErrores();

  const datos = Object.fromEntries(new FormData(formulario));
  datos.categoria_id = Number(datos.categoria_id);
  datos.costo_interno = Number(datos.costo_interno);

  const textoOriginal = boton.textContent;
  boton.disabled = true;
  boton.textContent = 'Guardando…';

  try {
    await crearEquipo(datos);
    formulario.reset();
    await cargarPagina();
  } catch (error) {
    if (error instanceof ErrorApi && error.estado === 422) {
      mostrarErrores(error.errores);
    } else {
      alert(error.message);
    }
  } finally {
    boton.disabled = false;
    boton.textContent = textoOriginal;
  }
});

cargarCategorias();
