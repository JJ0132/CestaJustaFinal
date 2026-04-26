using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CestaJusta.API.Data;
using CestaJusta.API.Models;

namespace CestaJusta.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MenuSemanalController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MenuSemanalController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MenuSemanal>>> GetMenusSemanales([FromQuery] bool? esVegetariano)
        {
            var query = _context.MenuSemanales
                .Include(m => m.Lunes).ThenInclude(d => d.Desayuno)
                .Include(m => m.Lunes).ThenInclude(d => d.Comida)
                .Include(m => m.Lunes).ThenInclude(d => d.Cena)
                .Include(m => m.Martes).ThenInclude(d => d.Desayuno)
                .Include(m => m.Martes).ThenInclude(d => d.Comida)
                .Include(m => m.Martes).ThenInclude(d => d.Cena)
                .Include(m => m.Miercoles).ThenInclude(d => d.Desayuno)
                .Include(m => m.Miercoles).ThenInclude(d => d.Comida)
                .Include(m => m.Miercoles).ThenInclude(d => d.Cena)
                .Include(m => m.Jueves).ThenInclude(d => d.Desayuno)
                .Include(m => m.Jueves).ThenInclude(d => d.Comida)
                .Include(m => m.Jueves).ThenInclude(d => d.Cena)
                .Include(m => m.Viernes).ThenInclude(d => d.Desayuno)
                .Include(m => m.Viernes).ThenInclude(d => d.Comida)
                .Include(m => m.Viernes).ThenInclude(d => d.Cena)
                .Include(m => m.Sabado).ThenInclude(d => d.Desayuno)
                .Include(m => m.Sabado).ThenInclude(d => d.Comida)
                .Include(m => m.Sabado).ThenInclude(d => d.Cena)
                .Include(m => m.Domingo).ThenInclude(d => d.Desayuno)
                .Include(m => m.Domingo).ThenInclude(d => d.Comida)
                .Include(m => m.Domingo).ThenInclude(d => d.Cena)
                .AsQueryable();

            if (esVegetariano.HasValue)
            {
                query = query.Where(m => m.EsVegetariano == esVegetariano.Value);
            }

            return await query.ToListAsync();
        }
    }
}
