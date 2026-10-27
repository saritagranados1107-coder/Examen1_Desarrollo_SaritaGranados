import { listarEquipos, eliminarEquipo } from '../modules/equipos.js';

const POR_PAGINA = 6;

// Elementos del DOM uwu
const lista = document.querySelector('#lista-equipos');
const plantilla = document.querySelector('#tpl-equipo');
const resumen = document.querySelector('#resumen');
const indicador = document.querySelector('#pagina-actual');
const btnAnterior = document.querySelector('#btn-anterior');
const btnSiguiente = document.querySelector('#btn-siguiente');
const vacio = document.querySelector('#estado-vacio');

let paginaActual = 1;

// Carga la página de equipos y 'pinta' la lista en el DOM
export async function cargarPagina(pagina = paginaActual) {
  lista.setAttribute('aria-busy', 'true');
  try {
    const { data, meta } = await listarEquipos({ page: pagina, per_page: POR_PAGINA });
    paginaActual = meta.current_page;
    pintar(data, meta);
  } catch (error) {
    resumen.textContent = error.message;
  } finally {
    lista.setAttribute('aria-busy', 'false');
  }
}

function pintar(equipos, meta) {
  lista.replaceChildren(); //replaceChildren() elimina todos los hijos y luego agrega los nuevos, es más eficiente que innerHTML, según la ia de VS.
  vacio.hidden = equipos.length > 0;

  for (const equipo of equipos) {
    const tarjeta = plantilla.content.cloneNode(true);
    const item = tarjeta.firstElementChild;

    item.dataset.id = equipo.id;
    item.dataset.estado = equipo.estado;
    item.querySelector('.codigo').textContent = equipo.codigo;
    item.querySelector('.nombre').textContent = equipo.nombre;
    item.querySelector('.estado').textContent = equipo.estado;
    item.querySelector('.categoria').textContent = equipo.categoria.nombre;
    item.querySelector('.fecha').textContent = equipo.fecha_adquisicion;

    lista.append(item);
  }

  resumen.textContent = meta.total
    ? `Mostrando ${meta.from}–${meta.to} de ${meta.total}`
    : 'Sin resultados';
  indicador.textContent = `Página ${meta.current_page} de ${meta.last_page}`;
  btnAnterior.disabled = meta.current_page <= 1;
  btnSiguiente.disabled = meta.current_page >= meta.last_page;
}

btnAnterior.addEventListener('click', () => cargarPagina(paginaActual - 1));
btnSiguiente.addEventListener('click', () => cargarPagina(paginaActual + 1));

// F4 · Delegación de eventos: un solo listener sobre la lista
lista.addEventListener('click', async (evento) => {
  const boton = evento.target.closest('.btn-eliminar');
  if (!boton) return;

  const tarjeta = boton.closest('[data-id]');
  if (!confirm('¿Eliminar este equipo?')) return;

  try {
    await eliminarEquipo(tarjeta.dataset.id);
    const quedaVacia = lista.children.length === 1 && paginaActual > 1;
    await cargarPagina(quedaVacia ? paginaActual - 1 : paginaActual);
  } catch (error) {
    alert(error.message); // En un 409 es el mensaje que envía la API, parte del backend. En otros casos es un mensaje genérico.
  }
});

cargarPagina();