using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CestaJusta.API.Data;
using CestaJusta.API.Models;
using CestaJusta.API.Security;

namespace CestaJusta.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuariosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsuariosController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("registro")]
        public async Task<ActionResult<UsuarioResponse>> Registro([FromBody] RegistroRequest request)
        {
            var email = request.Email.Trim().ToLowerInvariant();
            var nombreUsuario = request.NombreUsuario.Trim();

            if (string.IsNullOrWhiteSpace(email) ||
                string.IsNullOrWhiteSpace(nombreUsuario) ||
                string.IsNullOrWhiteSpace(request.Contrasena))
            {
                return BadRequest(new { message = "Email, nombre de usuario y contraseña son obligatorios." });
            }

            if (await _context.Usuarios.AnyAsync(u => u.Email == email))
            {
                return Conflict(new { message = "Ese correo ya está registrado." });
            }

            if (await _context.Usuarios.AnyAsync(u => u.NombreUsuario.ToLower() == nombreUsuario.ToLower()))
            {
                return Conflict(new { message = "Ese nombre de usuario ya existe." });
            }

            var usuario = new Usuario
            {
                Email = email,
                Nombre = request.Nombre.Trim(),
                Apellido1 = request.Apellido1.Trim(),
                Apellido2 = request.Apellido2?.Trim(),
                NombreUsuario = nombreUsuario,
                ContrasenaHash = PasswordHasher.Hash(request.Contrasena),
                Telefono = request.Telefono?.Trim(),
                FechaCreacion = DateTime.UtcNow,
                Premium = false
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetByEmail), new { email = usuario.Email }, ToResponse(usuario));
        }

        [HttpPost("login")]
        public async Task<ActionResult<UsuarioResponse>> Login([FromBody] LoginRequest request)
        {
            var identifier = request.UsuarioOEmail.Trim().ToLowerInvariant();
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u =>
                u.Email.ToLower() == identifier ||
                u.NombreUsuario.ToLower() == identifier);

            if (usuario == null || !PasswordHasher.Verify(request.Contrasena, usuario.ContrasenaHash))
            {
                return Unauthorized(new { message = "Usuario o contraseña incorrectos." });
            }

            return ToResponse(usuario);
        }

        [HttpPost("google")]
        public async Task<ActionResult<UsuarioResponse>> Google([FromBody] GoogleLoginRequest request)
        {
            var email = request.Email.Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(email)) return BadRequest(new { message = "Email obligatorio." });

            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == email);
            if (usuario == null)
            {
                var baseUsername = email.Split('@')[0];
                var username = baseUsername;
                var counter = 1;
                while (await _context.Usuarios.AnyAsync(u => u.NombreUsuario.ToLower() == username.ToLower()))
                {
                    username = $"{baseUsername}{counter++}";
                }

                usuario = new Usuario
                {
                    Email = email,
                    Nombre = string.IsNullOrWhiteSpace(request.Nombre) ? "Usuario" : request.Nombre.Trim(),
                    Apellido1 = request.Apellido1?.Trim() ?? string.Empty,
                    Apellido2 = request.Apellido2?.Trim(),
                    NombreUsuario = username,
                    ContrasenaHash = PasswordHasher.Hash(Guid.NewGuid().ToString("N")),
                    FechaCreacion = DateTime.UtcNow,
                    Premium = false
                };

                _context.Usuarios.Add(usuario);
                await _context.SaveChangesAsync();
            }

            return ToResponse(usuario);
        }

        [HttpGet("{email}")]
        public async Task<ActionResult<UsuarioResponse>> GetByEmail(string email)
        {
            var normalizedEmail = email.Trim().ToLowerInvariant();
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == normalizedEmail);
            if (usuario == null) return NotFound();

            return ToResponse(usuario);
        }

        private static UsuarioResponse ToResponse(Usuario usuario) =>
            new(
                usuario.Email,
                usuario.Nombre,
                usuario.Apellido1,
                usuario.Apellido2,
                usuario.NombreUsuario,
                usuario.Telefono,
                usuario.FechaCreacion,
                usuario.Premium);
    }

    public record RegistroRequest(
        string Nombre,
        string Apellido1,
        string? Apellido2,
        string NombreUsuario,
        string Contrasena,
        string Email,
        string? Telefono);

    public record LoginRequest(string UsuarioOEmail, string Contrasena);

    public record GoogleLoginRequest(string Email, string? Nombre, string? Apellido1, string? Apellido2);

    public record UsuarioResponse(
        string Email,
        string Nombre,
        string Apellido1,
        string? Apellido2,
        string NombreUsuario,
        string? Telefono,
        DateTime FechaCreacion,
        bool Premium);
}
