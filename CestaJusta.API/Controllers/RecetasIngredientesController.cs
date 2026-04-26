using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CestaJusta.API.Data;
using CestaJusta.API.Models;

namespace CestaJusta.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RecetasIngredientesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RecetasIngredientesController(AppDbContext context)
        {
            _context = context;
        }

        // GET api/recetasingredientes?tipo=desayuno&recetaId=1
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RecetaIngrediente>>> GetByReceta([FromQuery] string tipo, [FromQuery] int recetaId)
        {
            if (string.IsNullOrWhiteSpace(tipo)) return BadRequest();
            var list = await _context.RecetasIngredientes.Include(r => r.Ingrediente).Where(r => r.RecetaTipo.ToLower() == tipo.ToLower() && r.RecetaId == recetaId).ToListAsync();
            return list;
        }
    }
}
