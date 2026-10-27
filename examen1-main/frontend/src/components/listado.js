import { listarEquipos, eliminarEquipo } from "../modules/equipos.js";
import { mostrarMensaje } from "./mensajes.js";

const POR_PAGINA = 6;

const $lista = document.querySelector("#lista-equipos");
const $plantilla = document.querySelector("#tpl-equipo");
const $resumen = document.querySelector("#resumen");
const $pagina = document.querySelector("#pagina-actual");
const $anterior = document.querySelector("#btn-anterior");
const $siguiente = document.querySelector("#btn-siguiente");

let paginaActual = 1;

export async function cargarPagina(pagina = paginaActual) {
  $lista.setAttribute("aria-busy", "true");
  try {
    const { data, meta } = await listarEquipos({ page: pagina, per_page: POR_PAGINA });
    paginaActual = meta.current_page;
    pintar(data, meta);
  } catch (error) {
    mostrarMensaje("error", error.message);
  } finally {
    $lista.setAttribute("aria-busy", "false");
  }
}

function crearTarjeta(equipo) {
  const $tarjeta = $plantilla.content.cloneNode(true).querySelector(".tarjeta");
  const $estado = $tarjeta.querySelector(".estado");

  $tarjeta.dataset.id = equipo.id;
  $tarjeta.dataset.estado = equipo.estado;
  $estado.dataset.estado = equipo.estado; // el CSS base pinta con .estado[data-estado]

  $tarjeta.querySelector(".codigo").textContent = equipo.codigo;
  $estado.textContent = equipo.estado;
  $tarjeta.querySelector(".nombre").textContent = equipo.nombre;
  $tarjeta.querySelector(".categoria").textContent = equipo.categoria.nombre;
  $tarjeta.querySelector(".fecha").textContent = equipo.fecha_adquisicion;

  return $tarjeta;
}

function crearVacio() {
  const $vacio = document.createElement("li");
  $vacio.className = "vacio";
  $vacio.textContent = "No hay equipos para mostrar.";
  return $vacio;
}

function pintar(equipos, meta) {
  $lista.replaceChildren(...(equipos.length ? equipos.map(crearTarjeta) : [crearVacio()]));

  $resumen.textContent = meta.total
    ? `Mostrando ${meta.from}–${meta.to} de ${meta.total}`
    : "Sin resultados";
  $pagina.textContent = `Página ${meta.current_page} de ${meta.last_page}`;
  $anterior.disabled = meta.current_page <= 1;
  $siguiente.disabled = meta.current_page >= meta.last_page;
}

async function eliminar(evento) {
  const $boton = evento.target.closest(".btn-eliminar");
  if (!$boton) return;

  const $tarjeta = $boton.closest("[data-id]");
  if (!confirm("¿Eliminar este equipo?")) return;

  try {
    await eliminarEquipo($tarjeta.dataset.id);
    mostrarMensaje("exito", "Equipo eliminado.");

    const quedaVacia = $lista.querySelectorAll(".tarjeta").length === 1 && paginaActual > 1;
    await cargarPagina(quedaVacia ? paginaActual - 1 : paginaActual);
  } catch (error) {
    mostrarMensaje("error", error.message); // en un 409 es el mensaje de la API
  }
}

export function iniciarListado() {
  $anterior.addEventListener("click", () => cargarPagina(paginaActual - 1));
  $siguiente.addEventListener("click", () => cargarPagina(paginaActual + 1));
  $lista.addEventListener("click", eliminar); // delegación: un solo listener
  cargarPagina(1);
}