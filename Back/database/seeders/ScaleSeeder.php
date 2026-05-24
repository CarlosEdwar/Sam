<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Employee;
use App\Models\Shift;
use Illuminate\Support\Str;

class ScaleSeeder extends Seeder
{
    public function run(): void
    {
        $userId   = 'dev_user_123';
        $tenantId = 'default-tenant';

        // ─── Turnos ──────────────────────────────────────────
        // Regras do Guia.txt:
        //   Operacional (Bar/Cozinha/Salão): T1 07:00-15:00 | T2 15:00-23:00
        //   Administrativo: horário comercial
        $shifts = [
            [
                'id'             => Str::uuid()->toString(),
                'name'           => 'Turno 1 - Manhã',
                'start_time'     => '07:00',
                'end_time'       => '15:00',
                'duration_hours' => 8,
                'user_id'        => $userId,
                'tenant_id'      => $tenantId,
                'created_at'     => now(),
                'updated_at'     => now(),
            ],
            [
                'id'             => Str::uuid()->toString(),
                'name'           => 'Turno 2 - Tarde',
                'start_time'     => '15:00',
                'end_time'       => '23:00',
                'duration_hours' => 8,
                'user_id'        => $userId,
                'tenant_id'      => $tenantId,
                'created_at'     => now(),
                'updated_at'     => now(),
            ],
            [
                'id'             => Str::uuid()->toString(),
                'name'           => 'Administrativo',
                'start_time'     => '08:00',
                'end_time'       => '18:00',
                'duration_hours' => 8,
                'user_id'        => $userId,
                'tenant_id'      => $tenantId,
                'created_at'     => now(),
                'updated_at'     => now(),
            ],
        ];

        // ─── Funcionários ────────────────────────────────────
        // sector: admin | bar | kitchen | hall
        // day_off: dia da semana fixo de folga (0=Dom, 1=Seg...) — operacional folga seg automático
        $employees = [
            // Administrativo
            ['id' => Str::uuid()->toString(), 'name' => 'Carlos Mendes',    'role' => 'Gerente',       'department' => 'Administrativo', 'sector' => 'admin',   'user_id' => $userId, 'tenant_id' => $tenantId, 'created_at' => now(), 'updated_at' => now()],
            ['id' => Str::uuid()->toString(), 'name' => 'Fernanda Lima',    'role' => 'Recepcionista',  'department' => 'Administrativo', 'sector' => 'admin',   'user_id' => $userId, 'tenant_id' => $tenantId, 'created_at' => now(), 'updated_at' => now()],

            // Bar
            ['id' => Str::uuid()->toString(), 'name' => 'Bruno Alves',      'role' => 'Barman',        'department' => 'Bar',            'sector' => 'bar',     'user_id' => $userId, 'tenant_id' => $tenantId, 'created_at' => now(), 'updated_at' => now()],
            ['id' => Str::uuid()->toString(), 'name' => 'Tatiane Ramos',    'role' => 'Bartender',     'department' => 'Bar',            'sector' => 'bar',     'user_id' => $userId, 'tenant_id' => $tenantId, 'created_at' => now(), 'updated_at' => now()],
            ['id' => Str::uuid()->toString(), 'name' => 'Diego Souza',      'role' => 'Auxiliar Bar',  'department' => 'Bar',            'sector' => 'bar',     'user_id' => $userId, 'tenant_id' => $tenantId, 'created_at' => now(), 'updated_at' => now()],

            // Cozinha
            ['id' => Str::uuid()->toString(), 'name' => 'Paulo Ferreira',   'role' => 'Cozinheiro',    'department' => 'Cozinha',        'sector' => 'kitchen', 'user_id' => $userId, 'tenant_id' => $tenantId, 'created_at' => now(), 'updated_at' => now()],
            ['id' => Str::uuid()->toString(), 'name' => 'Mariana Costa',    'role' => 'Auxiliar',      'department' => 'Cozinha',        'sector' => 'kitchen', 'user_id' => $userId, 'tenant_id' => $tenantId, 'created_at' => now(), 'updated_at' => now()],
            ['id' => Str::uuid()->toString(), 'name' => 'Rodrigo Lima',     'role' => 'Chef',          'department' => 'Cozinha',        'sector' => 'kitchen', 'user_id' => $userId, 'tenant_id' => $tenantId, 'created_at' => now(), 'updated_at' => now()],

            // Salão
            ['id' => Str::uuid()->toString(), 'name' => 'Ana Paula',        'role' => 'Garçonete',     'department' => 'Salão',          'sector' => 'hall',    'user_id' => $userId, 'tenant_id' => $tenantId, 'created_at' => now(), 'updated_at' => now()],
            ['id' => Str::uuid()->toString(), 'name' => 'Lucas Martins',    'role' => 'Garçom',        'department' => 'Salão',          'sector' => 'hall',    'user_id' => $userId, 'tenant_id' => $tenantId, 'created_at' => now(), 'updated_at' => now()],
            ['id' => Str::uuid()->toString(), 'name' => 'Juliana Pereira',  'role' => 'Maître',        'department' => 'Salão',          'sector' => 'hall',    'user_id' => $userId, 'tenant_id' => $tenantId, 'created_at' => now(), 'updated_at' => now()],
        ];

        // Bulk Insert to reduce Turso network round-trips
        Shift::insert($shifts);
        Employee::insert($employees);
    }
}
