<?php

use App\Models\Categoria;
use App\Models\Equipo;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

/*
| TODO [B6] Escriba las tres pruebas. Cada una debe verificar el código
| de estado Y algo más (estructura, encabezado, mensaje o estado de la base).
|
| Quite el ->todo() de cada prueba al implementarla.
| Ejecute:  php artisan test --filter=EquipoApi
*/

/*
==== RESULTADOS DE PRUEBAS 1 ====
  Tests:    2 failed, 1 warning (5 assertions)
  Duration: 0.75s
*/

it('crea un equipo y responde 201 con encabezado Location', function () {
    Sanctum::actingAs(User::factory()->create());
    $categoria = Categoria::query()->forceCreate(['nombre' => 'Cómputo']);

    $respuesta = $this->postJson('/api/equipos', [
        'codigo'            => 'EQ-9001',
        'nombre'            => 'Laptop de prueba',
        'categoria_id'      => $categoria->id,
        'fecha_adquisicion' => '2026-01-15',
        'costo_interno'     => 450000,
    ]);

    $respuesta->assertCreated()
        ->assertJsonPath('data.codigo', 'EQ-9001')
        ->assertJsonPath('data.categoria.nombre', 'Cómputo')
        ->assertJsonMissingPath('data.costo_interno');

    expect($respuesta->headers->get('Location'))->toContain('/api/equipos/');
    $this->assertDatabaseHas('equipos', ['codigo' => 'EQ-9001']);
});

it('responde 422 con errores por campo si los datos son inválidos', function () {
    Sanctum::actingAs(User::factory()->create());

    $respuesta = $this->postJson('/api/equipos', [
        'nombre'            => 'ab',
        'fecha_adquisicion' => '2999-01-01',
        'costo_interno'     => -5,
    ]);

    $respuesta->assertUnprocessable()
        ->assertJsonValidationErrors([
            'codigo',
            'nombre',
            'categoria_id',
            'fecha_adquisicion',
            'costo_interno',
        ]);

    $this->assertDatabaseCount('equipos', 0);
});

it('responde 409 al eliminar un equipo prestado', function () {
    Sanctum::actingAs(User::factory()->create());
    $categoria = Categoria::query()->forceCreate(['nombre' => 'Cómputo']);
    $equipo = Equipo::query()->forceCreate([
        'codigo'            => 'EQ-9002',
        'nombre'            => 'Proyector Epson',
        'categoria_id'      => $categoria->id,
        'estado'            => 'prestado',
        'fecha_adquisicion' => '2026-01-15',
        'costo_interno'     => 300000,
    ]);

    $this->deleteJson("/api/equipos/{$equipo->id}")
        ->assertStatus(409)
        ->assertExactJson([
            'mensaje' => 'No se puede eliminar un equipo prestado.',
            'codigo'  => 'REGLA_NEGOCIO',
        ]);

    $this->assertDatabaseHas('equipos', ['id' => $equipo->id]);
});
