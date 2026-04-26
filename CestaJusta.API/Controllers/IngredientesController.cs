using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CestaJusta.API.Data;
using CestaJusta.API.Models;

namespace CestaJusta.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IngredientesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public IngredientesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Ingrediente>>> GetAll()
        {
            return await _context.Ingredientes.ToListAsync();
        }

        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<Ingrediente>>> Search([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q)) return BadRequest();
            var lower = q.ToLower();
            var res = await _context.Ingredientes.Where(i => i.Nombre.ToLower().Contains(lower)).ToListAsync();
            return res;
        }
    }
}
