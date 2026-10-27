import { listarEquipos, eliminarEquipo } from '../modules/equipos.js';

const POR_PAGINA = 6;

const lista = document.querySelector('#lista-equipos');
const plantilla = document.querySelector('#tpl-equipo');
const resumen = document.querySelector('#resumen');
const indicador = document.querySelector('#pagina-actual');
const btnAnterior = document.querySelector('#btn-anterior');
const btnSiguiente = document.querySelector('#btn-siguiente');
const mensajes = document.querySelector('#mensajes');

let paginaActual = 1;

export function notificar(texto, tipo = 'info') {
  const aviso = document.createElement('div');
  aviso.className = `mensaje mensaje-${tipo}`;
  aviso.textContent = texto;
  mensajes.append(aviso);
  setTimeout(() => aviso.remove(), 5000);
}

export async function cargarPagina(pagina = paginaActual) {
  lista.setAttribute('aria-busy', 'true');
  try {
    const { data, meta } = await listarEquipos({ page: pagina, per_page: POR_PAGINA });
    paginaActual = meta.current_page;
    pintar(data, meta);
  } catch (error) {
    notificar(error.message, 'error');
  } finally {
    lista.setAttribute('aria-busy', 'false');
  }
}

export const iniciarListado = () => cargarPagina(1);

function crearTarjeta(equipo) {
  const item = plantilla.content.cloneNode(true).querySelector('.tarjeta');
  const estado = item.querySelector('.estado');

  item.dataset.id = equipo.id;
  item.dataset.estado = equipo.estado;
  estado.dataset.estado = equipo.estado; // el CSS base pinta con .estado[data-estado]

  item.querySelector('.codigo').textContent = equipo.codigo;
  estado.textContent = equipo.estado;
  item.querySelector('.nombre').textContent = equipo.nombre;
  item.querySelector('.categoria').textContent = equipo.categoria.nombre;
  item.querySelector('.fecha').textContent = equipo.fecha_adquisicion;

  return item;
}

function crearVacio() {
  const vacio = document.createElement('li');
  vacio.className = 'vacio';
  vacio.textContent = 'No hay equipos para mostrar.';
  return vacio;
}

function pintar(equipos, meta) {
  const elementos = equipos.length ? equipos.map(crearTarjeta) : [crearVacio()];
  lista.replaceChildren(...elementos);

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
    notificar('Equipo eliminado.', 'exito');

    const quedaVacia = lista.querySelectorAll('.tarjeta').length === 1 && paginaActual > 1;
    await cargarPagina(quedaVacia ? paginaActual - 1 : paginaActual);
  } catch (error) {
    notificar(error.message, 'error'); // en un 409 es el mensaje que envía la API
  }
});