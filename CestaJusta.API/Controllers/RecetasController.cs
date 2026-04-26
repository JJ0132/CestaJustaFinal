using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CestaJusta.API.Data;
using CestaJusta.API.Models;

namespace CestaJusta.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RecetasController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RecetasController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("desayunos")]
        public async Task<ActionResult<IEnumerable<RecetaDesayuno>>> GetDesayunos()
        {
            return await _context.RecetasDesayuno.ToListAsync();
        }

        [HttpGet("comidas")]
        public async Task<ActionResult<IEnumerable<RecetaComida>>> GetComidas()
        {
            return await _context.RecetasComida.ToListAsync();
        }

        [HttpGet("cenas")]
        public async Task<ActionResult<IEnumerable<RecetaCena>>> GetCenas()
        {
            return await _context.RecetasCena.ToListAsync();
        }
    }
}
