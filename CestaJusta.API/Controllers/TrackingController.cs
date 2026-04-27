using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CestaJusta.API.Data;
using CestaJusta.API.Models;

namespace CestaJusta.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TrackingController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TrackingController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("{email}")]
        public async Task<ActionResult<TrackingResumenResponse>> GetResumen(string email)
        {
            var usuario = await GetPremiumUser(email);
            if (usuario == null) return Forbid();

            var registros = await _context.TrackingRegistros
                .Where(t => t.UsuarioEmail == usuario.Email)
                .OrderBy(t => t.Fecha)
                .ToListAsync();

            return BuildResumen(registros);
        }

        [HttpPost("plan")]
        public async Task<ActionResult<TrackingResumenResponse>> RegistrarPlan([FromBody] RegistrarPlanRequest request)
        {
            var usuario = await GetPremiumUser(request.UsuarioEmail);
            if (usuario == null) return Forbid();
            if (request.GastosDiarios.Count == 0) return BadRequest(new { message = "Debe enviarse al menos un gasto diario." });

            var fechaInicio = request.FechaInicio?.Date ?? DateTime.UtcNow.Date;
            var gastoSemanal = request.GastoSemanal > 0 ? request.GastoSemanal : request.GastosDiarios.Sum();
            var gastoMensual = await CalcularGastoMensual(usuario.Email, gastoSemanal);

            for (var i = 0; i < request.GastosDiarios.Count; i++)
            {
                _context.TrackingRegistros.Add(new TrackingRegistro
                {
                    UsuarioEmail = usuario.Email,
                    Fecha = fechaInicio.AddDays(i),
                    GastoDiario = request.GastosDiarios[i],
                    GastoSemanal = gastoSemanal,
                    GastoMensual = gastoMensual
                });
            }

            await _context.SaveChangesAsync();

            var registros = await _context.TrackingRegistros
                .Where(t => t.UsuarioEmail == usuario.Email)
                .OrderBy(t => t.Fecha)
                .ToListAsync();

            return BuildResumen(registros);
        }

        [HttpPost("menu-semanal/{menuSemanalId:int}")]
        public async Task<ActionResult<TrackingResumenResponse>> RegistrarMenuSemanal(int menuSemanalId, [FromBody] RegistrarMenuSemanalRequest request)
        {
            var usuario = await GetPremiumUser(request.UsuarioEmail);
            if (usuario == null) return Forbid();

            var menu = await _context.MenuSemanales
                .Include(m => m.Lunes)
                .Include(m => m.Martes)
                .Include(m => m.Miercoles)
                .Include(m => m.Jueves)
                .Include(m => m.Viernes)
                .Include(m => m.Sabado)
                .Include(m => m.Domingo)
                .FirstOrDefaultAsync(m => m.Id == menuSemanalId);

            if (menu == null) return NotFound();

            var diarios = new[]
            {
                menu.Lunes,
                menu.Martes,
                menu.Miercoles,
                menu.Jueves,
                menu.Viernes,
                menu.Sabado,
                menu.Domingo
            };
            var gastoMensual = await CalcularGastoMensual(usuario.Email, menu.PrecioSemana);
            var fechaInicio = request.FechaInicio?.Date ?? DateTime.UtcNow.Date;

            for (var i = 0; i < diarios.Length; i++)
            {
                _context.TrackingRegistros.Add(new TrackingRegistro
                {
                    UsuarioEmail = usuario.Email,
                    Fecha = fechaInicio.AddDays(i),
                    GastoDiario = diarios[i].PrecioTotalDia,
                    GastoSemanal = menu.PrecioSemana,
                    GastoMensual = gastoMensual,
                    MenuDiarioId = diarios[i].Id,
                    MenuSemanalId = menu.Id
                });
            }

            await _context.SaveChangesAsync();

            var registros = await _context.TrackingRegistros
                .Where(t => t.UsuarioEmail == usuario.Email)
                .OrderBy(t => t.Fecha)
                .ToListAsync();

            return BuildResumen(registros);
        }

        private async Task<Usuario?> GetPremiumUser(string email)
        {
            var normalizedEmail = email.Trim().ToLowerInvariant();
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == normalizedEmail);
            return usuario is { Premium: true } ? usuario : null;
        }

        private async Task<decimal> CalcularGastoMensual(string usuarioEmail, decimal gastoSemanalActual)
        {
            var semanasPrevias = await _context.TrackingRegistros
                .Where(t => t.UsuarioEmail == usuarioEmail && t.GastoSemanal > 0)
                .OrderByDescending(t => t.Fecha)
                .Select(t => new { t.Fecha, t.GastoSemanal })
                .ToListAsync();

            return gastoSemanalActual + semanasPrevias
                .GroupBy(t => GetWeekStart(t.Fecha))
                .Take(3)
                .Sum(g => g.Max(x => x.GastoSemanal));
        }

        private static TrackingResumenResponse BuildResumen(List<TrackingRegistro> registros)
        {
            var diarios = registros
                .GroupBy(r => r.Fecha.Date)
                .OrderBy(g => g.Key)
                .Select(g => new TrackingPoint(g.Key, g.Last().GastoDiario))
                .ToList();

            var semanales = registros
                .GroupBy(r => GetWeekStart(r.Fecha))
                .OrderBy(g => g.Key)
                .Select(g => new TrackingPoint(g.Key, g.Max(r => r.GastoSemanal)))
                .ToList();

            var mensuales = registros
                .GroupBy(r => new DateTime(r.Fecha.Year, r.Fecha.Month, 1))
                .OrderBy(g => g.Key)
                .Select(g => new TrackingPoint(g.Key, g.Sum(r => r.GastoDiario)))
                .ToList();

            return new TrackingResumenResponse(diarios, semanales, mensuales);
        }

        private static DateTime GetWeekStart(DateTime date)
        {
            var offset = ((int)date.DayOfWeek + 6) % 7;
            return date.Date.AddDays(-offset);
        }
    }

    public record RegistrarPlanRequest(string UsuarioEmail, DateTime? FechaInicio, List<decimal> GastosDiarios, decimal GastoSemanal);

    public record RegistrarMenuSemanalRequest(string UsuarioEmail, DateTime? FechaInicio);

    public record TrackingPoint(DateTime Fecha, decimal Gasto);

    public record TrackingResumenResponse(List<TrackingPoint> Diarios, List<TrackingPoint> Semanales, List<TrackingPoint> Mensuales);
}
