<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use App\Exceptions\ReglaNegocioException;

// ---------------------------------------------------------------
        // TODO [B5] Manejo centralizado de errores
        //
        // Traduzca App\Exceptions\ReglaNegocioException a una respuesta
        // JSON con código 409 y el cuerpo:
        //
        //     { "mensaje": "<mensaje de la excepción>", "codigo": "REGLA_NEGOCIO" }
        //
        // Además, evite que estas excepciones se registren en la bitácora:
        // no son errores del sistema, son reglas del dominio.
        // ---------------------------------------------------------------

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
    // No se registra en la bitácora: es un error esperado del negocio
    $exceptions->dontReport(ReglaNegocioException::class);

    $exceptions->render(function (ReglaNegocioException $e, Request $request) {
        return response()->json([
            'mensaje' => $e->getMessage(),
            'codigo'  => 'REGLA_NEGOCIO',
        ], 409);
    });
})->create();
