<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\GuardarEquipoRequest;
use App\Models\Equipo;
use App\Http\Resources\EquipoResource;
use App\Services\EquipoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * TODO [B3] Controlador delgado: recibe, delega en el servicio y responde.
 *
 *  - Ningún método supera 15 líneas.
 *  - Ninguna regla de negocio vive aquí.
 *  - Nunca devuelva el modelo directo: use EquipoResource.
 *
 * Contrato que debe cumplir:
 *
 *  GET    /api/equipos?page=&per_page=&q=&estado=  200  colección paginada con data, links y meta
 *                                                       per_page por omisión 10, tope máximo 50
 *  GET    /api/equipos/{id}                        200  | 404
 *  POST   /api/equipos                             201 + encabezado Location | 422
 *  PUT    /api/equipos/{id}                        200  | 404 | 422
 *  DELETE /api/equipos/{id}                        204  | 404 | 409 (R1)
 *  POST   /api/equipos/{id}/prestamo               200  | 404 | 409 (R2)
 */

class EquipoController extends Controller
{
    public function __construct(private EquipoService $servicio) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $porPagina = min(max($request->integer('per_page', 10), 1), 50);

        return EquipoResource::collection(
            $this->servicio->listar($request->query('q'), $request->query('estado'), $porPagina)
        );
    }

    public function show(int $id): EquipoResource
    {
        return new EquipoResource($this->servicio->obtener($id));
    }

    public function store(GuardarEquipoRequest $request): JsonResponse
    {
        $equipo = $this->servicio->crear($request->validated());

        return new EquipoResource($equipo)
            ->response()
            ->setStatusCode(201)
            ->header('Location', url("/api/equipos/{$equipo->getKey()}"));
    }

    public function update(GuardarEquipoRequest $request, int $id): EquipoResource
    {
        return new EquipoResource($this->servicio->actualizar($id, $request->all()));
    }

    public function destroy(int $id): Response
    {
        $this->servicio->eliminar($id);

        return response()->noContent();
    }

    public function prestamo(int $id): EquipoResource
    {
        return new EquipoResource($this->servicio->prestar($id));
    }
}
