<?php

namespace App\Services;

use App\Exceptions\ReglaNegocioException;
use App\Models\Equipo;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * TODO [B2] Capa de negocio de equipos.
 *
 * Esta clase NO conoce HTTP: no use request(), response(), abort() ni códigos
 * de estado aquí. Cuando una regla del dominio lo impida, lance
 * ReglaNegocioException con un mensaje en español.
 *
 * Reglas de negocio exigidas:
 *  R1. No se puede eliminar un equipo que está prestado.
 *      Mensaje: "No se puede eliminar un equipo prestado."
 *  R2. Solo se puede prestar un equipo disponible.
 *      - Si está en mantenimiento: "No se puede prestar un equipo en mantenimiento."
 *      - Si ya está prestado:     "El equipo ya se encuentra prestado."
 */

class EquipoService
{
        /**
     * Listado paginado con la categoría cargada de forma anticipada (sin N+1),
     * ordenado por código. Filtros opcionales:
     *  - $q:      busca en código o nombre (coincidencia parcial)
     *  - $estado: filtra por estado exacto
     */
    public function listar(?string $q, ?string $estado, int $porPagina = 10): LengthAwarePaginator
    {
        return Equipo::with('categoria')
            ->when($q, fn ($consulta) => $consulta->where(
                fn ($w) => $w->where('codigo', 'like', "%{$q}%")
                             ->orWhere('nombre', 'like', "%{$q}%")
            ))
            ->when($estado, fn ($consulta) => $consulta->where('estado', $estado))
            ->orderBy('codigo')
            ->paginate($porPagina)
            ->withQueryString();
    }

    public function obtener(int $id): Equipo
    {
        return Equipo::with('categoria')->findOrFail($id);
    }

    public function crear(array $datos): Equipo
    {
        $datos['estado'] ??= 'disponible';

        return Equipo::create($datos)->load('categoria');
    }

    public function actualizar(int $id, array $datos): Equipo
    {
        $equipo = Equipo::findOrFail($id);
        $equipo->update($datos);

        return $equipo->load('categoria');
    }

    public function eliminar(int $id): void
    {
        $equipo = Equipo::findOrFail($id);

        // R1
        if ($equipo->estado === 'prestado') {
            throw new ReglaNegocioException('No se puede eliminar un equipo prestado.');
        }

        $equipo->delete();
    }

    public function prestar(int $id): Equipo
    {
        $equipo = Equipo::findOrFail($id);

        // R2
        if ($equipo->estado === 'mantenimiento') {
            throw new ReglaNegocioException('No se puede prestar un equipo en mantenimiento.');
        }
        if ($equipo->estado === 'prestado') {
            throw new ReglaNegocioException('El equipo ya se encuentra prestado.');
        }

        $equipo->update(['estado' => 'prestado']);

        return $equipo->load('categoria');
    }
}
