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
import { crearEquipo, listarCategorias } from "../modules/equipos.js";
import { mostrarMensaje } from "./mensajes.js";

const $formulario = document.querySelector("#form-equipo");
const $categoria = $formulario.querySelector("[name='categoria_id']");
const $guardar = document.querySelector("#btn-guardar");

async function cargarCategorias() {
  try {
    const { data } = await listarCategorias();
    $categoria.append(...data.map(({ id, nombre }) => new Option(nombre, id)));
  } catch (error) {
    mostrarMensaje("error", error.message);
  }
}

function limpiarErrores() {
  $formulario.querySelectorAll("[data-error]").forEach(($p) => ($p.textContent = ""));
  $formulario.querySelectorAll("[aria-invalid]").forEach(($c) => $c.removeAttribute("aria-invalid"));
}

function mostrarErrores(errores = {}) {
  for (const [campo, [mensaje]] of Object.entries(errores)) {
    const $error = $formulario.querySelector(`[data-error="${campo}"]`);
    if ($error) $error.textContent = mensaje;
    $formulario.querySelector(`[name="${campo}"]`)?.setAttribute("aria-invalid", "true");
  }
}

export function iniciarFormulario({ alGuardar }) {
  cargarCategorias();

  $formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    limpiarErrores();

    const datos = Object.fromEntries(new FormData($formulario));
    datos.categoria_id = Number(datos.categoria_id);
    datos.costo_interno = datos.costo_interno === "" ? null : Number(datos.costo_interno);

    const textoOriginal = $guardar.textContent;
    $guardar.disabled = true;
    $guardar.textContent = "Guardando…";

    try {
      const { data: creado } = await crearEquipo(datos);
      $formulario.reset();
      mostrarMensaje("exito", `Equipo ${creado.codigo} registrado.`);
      await alGuardar();
    } catch (error) {
      if (error.status === 422) {
        mostrarErrores(error.datos?.errors);
      } else {
        mostrarMensaje("error", error.message);
      }
    } finally {
      $guardar.disabled = false;
      $guardar.textContent = textoOriginal;
    }
  });
}