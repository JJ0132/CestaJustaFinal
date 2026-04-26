using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CestaJusta.API.Models
{
    [Table("Ingredientes")]
    public class Ingrediente
    {
        [Key]
        [JsonPropertyName("Id")]
        public int Id { get; set; }

        [Required]
        [JsonPropertyName("Nombre")]
        public string Nombre { get; set; } = string.Empty;

        [JsonPropertyName("Precio")]
        public decimal Precio { get; set; }

        [JsonPropertyName("Fecha_Captura")]
        public DateTime FechaCaptura { get; set; }
    }
}
