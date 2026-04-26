using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CestaJusta.API.Data;
using CestaJusta.API.Models;

namespace CestaJusta.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MenuDiarioController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MenuDiarioController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MenuDiario>>> GetMenusDiarios([FromQuery] bool? esVegetariano)
        {
            var query = _context.MenuDiarios
                .Include(m => m.Desayuno)
                .Include(m => m.Comida)
                .Include(m => m.Cena)
                .AsQueryable();

            if (esVegetariano.HasValue)
            {
                query = query.Where(m => m.EsVegetariano == esVegetariano.Value);
            }

            return await query.ToListAsync();
        }

        [HttpGet("random")]
        public async Task<ActionResult<MenuDiario>> GetRandomMenuDiario([FromQuery] bool? esVegetariano)
        {
            var query = _context.MenuDiarios
                .Include(m => m.Desayuno)
                .Include(m => m.Comida)
                .Include(m => m.Cena)
                .AsQueryable();

            if (esVegetariano.HasValue)
            {
                query = query.Where(m => m.EsVegetariano == esVegetariano.Value);
            }

            // Simple random pick
            var count = await query.CountAsync();
            if (count == 0) return NotFound();

            var rnd = new Random().Next(0, count);
            var randomMenu = await query.Skip(rnd).FirstOrDefaultAsync();

            return randomMenu!;
        }
    }
}
